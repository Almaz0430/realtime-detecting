#!/usr/bin/env python3
"""
REST API для обнаружения дефектов окраски автомобилей
с использованием YOLOv8 и Flask.
"""

import os
import io
import base64
from pathlib import Path
from datetime import datetime
import cv2
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import json
import google.generativeai as genai

try:
    GEMINI_API_KEY = "AIzaSyC6Ja-qGbZWCDSDEZlPN3gwYMUxAWckhXQ"
    # GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    # if not GEMINI_API_KEY:
    #     raise ValueError("GEMINI_API_KEY не найден в переменных окружения.")
        
    genai.configure(api_key=GEMINI_API_KEY)
    
    SYSTEM_PROMPT = """You are a senior AI quality control specialist. Your task is to provide a final, comprehensive report for an end-user based on two sources of information: an original user-uploaded IMAGE and a JSON_DATA report from a preliminary ML detection model.

    1.  **Analyze the IMAGE:** First, personally inspect the provided IMAGE for any visible paint defects (like scratches, dents, bubbling, etc.).
    2.  **Analyze the JSON_DATA:** Second, review the `detections` and `class_counts` from the `JSON_DATA` provided by the local ML model.
    3.  **Synthesize and Report:** Combine your own visual analysis with the model's data to create a single, detailed report.
        * State the total defects found by the local model (`total_defects`).
        * If the local model's detections (e.g., `class: "bubbling"`) match what you see in the IMAGE, confirm this (e.g., "The model correctly identified 'bubbling'").
        * If the local model missed something you see, point it out (e.g., "In addition to the model's findings, I also observe a 'scratch' that was not flagged").
        * If the local model's finding seems incorrect or has low confidence, add your assessment.
        * If no defects are found by either you or the model, congratulate the user.
        * Conclude by informing the user that a processed image with the *model's* detections highlighted (`result_image`) is also available.
    4.  **Tone:** Be professional, polite, and informative.
    5.  **CRITICAL INSTRUCTION:** You must provide your entire final response in the Russian language.
    """
    
    gemini_model = genai.GenerativeModel(
        model_name="models/gemini-flash-latest",  # <-- Вот точное имя
        system_instruction=SYSTEM_PROMPT
    )
    print("Клиент Gemini успешно сконфигурирован.")

except Exception as e:
    print(f"Ошибка конфигурации Gemini: {e}")
    gemini_model = None
# -----------------------------

class PaintDefectDetector:
    """Класс для обнаружения дефектов окраски"""
    
    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.model = None
        self.class_names = [
            'scratch',           # царапины
            'dent',             # вмятины  
            'paint_run',        # подтёки краски
            'undercoat_missing', # непрокрасы
            'contamination',    # сорность
            'bubbling'          # вспучивание
        ]
        
        # Цвета для визуализации (BGR формат для OpenCV)
        self.colors = {
            'scratch': (0, 0, 255),           # красный
            'dent': (255, 0, 0),             # синий
            'paint_run': (0, 255, 255),      # желтый
            'undercoat_missing': (255, 0, 255), # магента
            'contamination': (0, 255, 0),    # зеленый
            'bubbling': (255, 165, 0)        # оранжевый
        }
        
        self.load_model()
    
    def load_model(self):
        """Загружает обученную модель"""
        if not self.model_path.exists():
            raise FileNotFoundError(f"Модель не найдена: {self.model_path}")
        
        try:
            self.model = YOLO(str(self.model_path))
            print(f"✅ Модель загружена: {self.model_path}")
        except Exception as e:
            raise RuntimeError(f"Ошибка загрузки модели: {e}")
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Предобработка изображения"""
        # Конвертируем в RGB если необходимо
        if len(image.shape) == 3 and image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        return image
    
    def detect_defects(self, image: np.ndarray, confidence_threshold: float = 0.5):
        """Обнаруживает дефекты на изображении"""
        if self.model is None:
            raise RuntimeError("Модель не загружена")
        
        # Предобработка
        processed_image = self.preprocess_image(image)
        
        # Запуск детекции
        results = self.model(processed_image, conf=confidence_threshold)
        
        # Обработка результатов
        detections = []
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Получаем координаты bbox
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    
                    # Получаем класс и уверенность
                    class_id = int(box.cls[0].cpu().numpy())
                    confidence = float(box.conf[0].cpu().numpy())
                    
                    # Получаем название класса
                    class_name = self.class_names[class_id] if class_id < len(self.class_names) else f"class_{class_id}"
                    
                    detection = {
                        'bbox': [float(x1), float(y1), float(x2), float(y2)],
                        'class': class_name,
                        'confidence': confidence,
                        'class_id': class_id
                    }
                    
                    detections.append(detection)
        
        return detections
    
    def draw_detections(self, image: np.ndarray, detections: list) -> np.ndarray:
        """Рисует обнаруженные дефекты на изображении"""
        result_image = image.copy()
        
        for detection in detections:
            x1, y1, x2, y2 = detection['bbox']
            class_name = detection['class']
            confidence = detection['confidence']
            
            # Получаем цвет для класса
            color = self.colors.get(class_name, (128, 128, 128))
            
            # Рисуем прямоугольник
            cv2.rectangle(result_image, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
            
            # Подготавливаем текст
            label = f"{class_name}: {confidence:.2f}"
            
            # Получаем размер текста
            (text_width, text_height), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            
            # Рисуем фон для текста
            cv2.rectangle(
                result_image,
                (int(x1), int(y1) - text_height - baseline - 5),
                (int(x1) + text_width, int(y1)),
                color,
                -1
            )
            
            # Рисуем текст
            cv2.putText(
                result_image,
                label,
                (int(x1), int(y1) - baseline - 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )
        
        return result_image


# Создаем Flask приложение
app = Flask(__name__)
CORS(app)  # Разрешаем CORS для фронтенда
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Инициализируем детектор
MODEL_PATH = Path(__file__).parent / "models" / "paint_defect.pt"
detector = None

try:
    if MODEL_PATH.exists():
        detector = PaintDefectDetector(str(MODEL_PATH))
    else:
        print(f"⚠️  Модель не найдена: {MODEL_PATH}")
        print("Сначала обучите модель: python utils/train_model.py")
except Exception as e:
    print(f"⚠️  Ошибка инициализации детектора: {e}")

@app.route('/')
def index():
    """Информация о API"""
    return jsonify({
        'name': 'Paint Defect Detection API',
        'version': '1.0.0',
        'description': 'REST API для обнаружения дефектов окраски автомобилей',
        'endpoints': {
            'POST /api/detect': 'Обнаружение дефектов на изображении',
            'GET /api/model_info': 'Информация о модели',
            'GET /api/health': 'Проверка состояния API'
        },
        'model_loaded': detector is not None,
        'gemini_loaded': gemini_model is not None,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/detect', methods=['POST'])
def detect_defects():
    """API для обнаружения дефектов"""
    
    if detector is None:
        return jsonify({'error': 'Модель детекции (detector) не загружена.', 'success': False}), 500
    
    if gemini_model is None:
        return jsonify({'error': 'Модель Gemini не загружена. Проверьте API-ключ.', 'success': False}), 500
    
    try:
        # Проверяем наличие файла
        if 'image' not in request.files:
            return jsonify({
                'error': 'Изображение не найдено',
                'success': False
            }), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({
                'error': 'Файл не выбран',
                'success': False
            }), 400
        
        # Получаем параметры
        confidence_threshold = float(request.form.get('confidence', 0.5))
        
        # Читаем изображение
        image_bytes = file.read()

        image = Image.open(io.BytesIO(image_bytes))
        
        image_np = np.array(image)
        
        # Конвертируем в BGR для OpenCV
        if len(image_np.shape) == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # Обнаруживаем дефекты
        detections = detector.detect_defects(image_np, confidence_threshold)
        
        # Рисуем результаты
        result_image = detector.draw_detections(image_np, detections)
        
        # Конвертируем результат в base64
        _, buffer = cv2.imencode('.jpg', result_image)
        result_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Подготавливаем статистику
        defect_counts = {}
        for detection in detections:
            class_name = detection['class']
            defect_counts[class_name] = defect_counts.get(class_name, 0) + 1
            

        total_defects = len(detections)
        
        ml_output_data = {
            'success': True,
            'detections': detections,
            'class_counts': defect_counts, 
            'total_defects': total_defects,
            'image_with_detections_available': True 
        }

        json_string = json.dumps(ml_output_data, ensure_ascii=False, indent=2)

        gemini_user_prompt_text = f"""
        Here is the JSON_DATA from our local detection model:
        ```json
        {json_string}
        Please analyze this JSON_DATA along with the provided user IMAGE and generate the final report as per your instructions. """
        
        image_pil_for_mime = Image.open(io.BytesIO(image_bytes))
        image_mime_type = Image.MIME.get(image_pil_for_mime.format)

        # Убедимся, что формат поддерживается
        if image_mime_type not in ['image/jpeg', 'image/png']:
            image_mime_type = 'image/jpeg' # Конвертируем в JPEG по умолчанию

        image_part = {
            "mime_type": image_mime_type,
            "data": image_bytes
        }

        gemini_report = ""
        try:
            # Отправляем список: [текст, изображение]
            response = gemini_model.generate_content([
                gemini_user_prompt_text, # Часть 1: Текст (JSON)
                image_part               # Часть 2: Изображение
            ])
            gemini_report = response.text
        except Exception as e:
            print(f"Ошибка при вызове Gemini API: {e}")
            gemini_report = "Не удалось сгенерировать подробный отчет."
            
        # данные фронту
        return jsonify({
            'success': True,
            'detections': detections,       # От локальной модели
            'defect_counts': defect_counts, # От локальной модели
            'total_defects': total_defects, # От локальной модели
            'result_image': result_base64,  # Картинка от локальной модели
            'gemini_report': gemini_report, # <-- Отчет от Gemini
            'timestamp': datetime.now().isoformat()
        })


    
    except Exception as e:
        return jsonify({
            'error': f'Ошибка обработки: {str(e)}',
            'success': False
        }), 500


@app.route('/api/model_info')
def model_info():
    """Информация о модели"""
    if detector is None:
        return jsonify({
            'loaded': False,
            'error': 'Модель не загружена'
        })
    
    return jsonify({
        'loaded': True,
        'model_path': str(detector.model_path),
        'classes': detector.class_names,
        'colors': {k: [int(c) for c in v] for k, v in detector.colors.items()}
    })


@app.route('/api/health')
def health_check():
    """Проверка состояния приложения"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': detector is not None,
        'timestamp': datetime.now().isoformat()
    })


@app.errorhandler(413)
def too_large(e):
    """Обработка слишком больших файлов"""
    return jsonify({
        'error': 'Файл слишком большой. Максимальный размер: 16MB',
        'success': False
    }), 413


@app.errorhandler(404)
def not_found(e):
    """Обработка 404 ошибок"""
    return jsonify({
        'error': 'Endpoint не найден',
        'success': False,
        'available_endpoints': [
            'GET /',
            'POST /api/detect',
            'GET /api/model_info',
            'GET /api/health'
        ]
    }), 404


@app.errorhandler(500)
def internal_error(e):
    """Обработка внутренних ошибок"""
    return jsonify({
        'error': 'Внутренняя ошибка сервера',
        'success': False
    }), 500


if __name__ == '__main__':
    print("="*60)
    print("СИСТЕМА ОБНАРУЖЕНИЯ ДЕФЕКТОВ ОКРАСКИ АВТОМОБИЛЕЙ")
    print("="*60)
    
    if detector is not None:
        print("✅ Модель загружена успешно")
        print(f"   Классы дефектов: {', '.join(detector.class_names)}")
    else:
        print("⚠️  Модель не загружена")
        print("   Для обучения модели выполните:")
        print("   1. Настройте .env файл с API ключом Roboflow")
        print("   2. python utils/merge_datasets.py")
        print("   3. python utils/train_model.py")
    
    print("\n🌐 Запуск веб-сервера...")
    print("   URL: http://localhost:5000")
    print("   Для остановки нажмите Ctrl+C")
    print("="*60)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )