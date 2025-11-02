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
from flask import Flask, request, jsonify, Response, send_from_directory
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
    
    SYSTEM_PROMPT = """You are an expert AI quality control analyst. Your task is to provide a concise and professional analysis of a vehicle's paint condition based on an uploaded IMAGE and a JSON_DATA report from a detection model.

    **Instructions:**

    1.  **Primary Analysis:** Review the `JSON_DATA` from the local model to understand its findings (`total_defects`, `detections`, `class_counts`).
    2.  **Visual Verification:** Briefly cross-reference the model's findings with your own inspection of the `IMAGE`.
    3.  **Synthesize a Professional Summary:** Generate a brief, expert summary in Russian.
        *   Start with a clear, one-sentence overview of the paint condition.
        *   Succinctly list the key defects identified by the model, confirming if they are visually accurate.
        *   If you notice any significant discrepancies (e.g., obvious defects missed by the model, or clear false positives), mention them briefly.
        *   Avoid conversational filler. Be direct and data-driven.
        *   If no defects are found, state it clearly and professionally.
        *   Conclude by mentioning that a processed image with highlighted detections is available.

    **Tone:** Professional, concise, and authoritative.

    **CRITICAL INSTRUCTION:** The entire response must be in Russian.
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

DATA_STORAGE_PATH = Path(__file__).parent / "detection_data.json"

def save_detection_data(data):
    """Сохраняет данные детекции в JSON-файл."""
    try:
        if DATA_STORAGE_PATH.exists():
            with open(DATA_STORAGE_PATH, 'r', encoding='utf-8') as f:
                records = json.load(f)
        else:
            records = []
        
        records.append(data)
        
        with open(DATA_STORAGE_PATH, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=4)
            
    except Exception as e:
        print(f"Ошибка при сохранении данных детекции: {e}")


class PaintDefectDetector:
    """Класс для обнаружения дефектов окраски"""
    
    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.model = None
        self.class_names = [
            'scratch',           # царапины
            'dent',             # вмятины  
            'runs',             # подтёки краски
            'bubbling'          # вспучивание
        ]
        
        # Цвета для визуализации (BGR формат для OpenCV)
        self.colors = {
            'scratch': (0, 0, 255),           # красный
            'dent': (255, 0, 0),             # синий
            'runs': (0, 255, 255),           # желтый
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

    def process_video(self, video_path: str, output_path: str, confidence_threshold: float = 0.5, skip_frames: int = 1):
        """
        Обрабатывает видео и создает новое видео с выделенными дефектами
        
        Args:
            video_path: путь к входному видео
            output_path: путь для сохранения обработанного видео
            confidence_threshold: порог уверенности для детекции
            skip_frames: обрабатывать каждый N-й кадр (для ускорения)
        
        Returns:
            dict: статистика обработки
        """
        cap = cv2.VideoCapture(video_path)
        
        # Получаем параметры видео
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Настраиваем кодек для выходного видео (H.264 для лучшей совместимости с браузерами)
        fourcc = cv2.VideoWriter_fourcc(*'avc1')  # H.264 кодек
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        processed_frames = 0
        total_detections = 0
        defect_summary = {}
        
        print(f"Обработка видео: {total_frames} кадров, {fps} FPS")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Обрабатываем только каждый skip_frames кадр
            if frame_count % skip_frames == 0:
                # Детекция дефектов
                detections = self.detect_defects(frame, confidence_threshold)
                
                # Рисуем детекции
                if detections:
                    frame = self.draw_detections(frame, detections)
                    total_detections += len(detections)
                    
                    # Подсчитываем типы дефектов
                    for detection in detections:
                        defect_type = detection['class']
                        defect_summary[defect_type] = defect_summary.get(defect_type, 0) + 1
                
                processed_frames += 1
                
                # Показываем прогресс
                if processed_frames % 30 == 0:
                    progress = (frame_count / total_frames) * 100
                    print(f"Прогресс: {progress:.1f}% ({frame_count}/{total_frames})")
            
            # Записываем кадр в выходное видео
            out.write(frame)
        
        # Освобождаем ресурсы
        cap.release()
        out.release()
        
        return {
            'total_frames': total_frames,
            'processed_frames': processed_frames,
            'total_detections': total_detections,
            'defect_summary': defect_summary,
            'output_path': output_path
        }

    def extract_frames_with_defects(self, video_path: str, output_dir: str, confidence_threshold: float = 0.5, max_frames: int = 10):
        """
        Извлекает кадры с дефектами из видео
        
        Args:
            video_path: путь к видео
            output_dir: папка для сохранения кадров
            confidence_threshold: порог уверенности
            max_frames: максимальное количество кадров для сохранения
        
        Returns:
            list: список сохраненных кадров с информацией о дефектах
        """
        cap = cv2.VideoCapture(video_path)
        
        os.makedirs(output_dir, exist_ok=True)
        
        frame_count = 0
        saved_frames = []
        
        while len(saved_frames) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Детекция дефектов
            detections = self.detect_defects(frame, confidence_threshold)
            
            if detections:
                # Сохраняем кадр с дефектами
                timestamp = frame_count / cap.get(cv2.CAP_PROP_FPS)
                filename = f"defect_frame_{frame_count:06d}_{timestamp:.2f}s.jpg"
                filepath = os.path.join(output_dir, filename)
                
                # Рисуем детекции и сохраняем
                frame_with_detections = self.draw_detections(frame, detections)
                cv2.imwrite(filepath, frame_with_detections)
                
                saved_frames.append({
                    'frame_number': frame_count,
                    'timestamp': timestamp,
                    'filename': filename,
                    'detections': detections,
                    'defect_count': len(detections)
                })
        
        cap.release()
        return saved_frames


# Создаем Flask приложение
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
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

@app.route('/temp/<filename>', methods=['GET', 'OPTIONS'])
def serve_temp_file(filename):
    """Статические файлы из папки temp с поддержкой Range requests"""
    if request.method == 'OPTIONS':
        # Обработка preflight запросов
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Range'
        return response
    
    temp_dir = Path(__file__).parent / "temp"
    file_path = temp_dir / filename
    
    if not file_path.exists():
        return jsonify({'error': 'File not found'}), 404
    
    # Получаем размер файла
    file_size = file_path.stat().st_size
    
    # Проверяем Range заголовок
    range_header = request.headers.get('Range', None)
    if range_header:
        # Парсим Range заголовок (например: "bytes=0-1023")
        byte_start = 0
        byte_end = file_size - 1
        
        if range_header.startswith('bytes='):
            range_match = range_header[6:].split('-')
            if range_match[0]:
                byte_start = int(range_match[0])
            if range_match[1]:
                byte_end = int(range_match[1])
        
        # Читаем нужную часть файла
        with open(file_path, 'rb') as f:
            f.seek(byte_start)
            data = f.read(byte_end - byte_start + 1)
        
        # Создаем ответ с частичным содержимым
        response = Response(
            data,
            206,  # Partial Content
            headers={
                'Content-Range': f'bytes {byte_start}-{byte_end}/{file_size}',
                'Accept-Ranges': 'bytes',
                'Content-Length': str(len(data)),
                'Content-Type': 'video/mp4',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Range',
            }
        )
        return response
    else:
        # Обычный запрос без Range
        response = send_from_directory(temp_dir, filename)
        # Добавляем CORS заголовки и поддержку Range
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Range'
        response.headers['Accept-Ranges'] = 'bytes'
        return response

@app.route('/')
def index():
    """Информация о API"""
    return jsonify({
        'name': 'Paint Defect Detection API',
        'version': '1.0.0',
        'description': 'REST API для обнаружения дефектов окраски автомобилей',
        'endpoints': {
            'POST /api/detect': 'Обнаружение дефектов на изображении',
            'POST /api/detect_video': 'Обнаружение дефектов в видео',
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
        generate_report = request.form.get('generate_report', 'false').lower() == 'true'
        
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
        
        # Сохраняем данные для статистики
        detection_record = {
            'timestamp': datetime.now().isoformat(),
            'total_defects': total_defects,
            'defect_counts': defect_counts,
            'confidence_threshold': confidence_threshold
        }
        save_detection_data(detection_record)

        gemini_report = ""
        if generate_report:
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
        response_data = ({
            'success': True,
            'detections': detections,       # От локальной модели
            'defect_counts': defect_counts, # От локальной модели
            'total_defects': total_defects, # От локальной модели
            'result_image': result_base64,  # Картинка от локальной модели
            'gemini_report': gemini_report, # <-- Отчет от Gemini
            'timestamp': datetime.now().isoformat()
        })

        json_string = json.dumps(response_data, ensure_ascii=False)

        return Response(json_string, mimetype='application/json; charset=utf-8')


    
    except Exception as e:
        return jsonify({
            'error': f'Ошибка обработки: {str(e)}',
            'success': False
        }), 500


@app.route('/api/detect_video', methods=['POST'])
def detect_video():
    """API для обнаружения дефектов в видео"""
    
    if detector is None:
        return jsonify({'error': 'Модель детекции не загружена.', 'success': False}), 500
    
    try:
        # Проверяем наличие файла
        if 'video' not in request.files:
            return jsonify({
                'error': 'Видеофайл не найден',
                'success': False
            }), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({
                'error': 'Файл не выбран',
                'success': False
            }), 400
        
        # Получаем параметры
        confidence_threshold = float(request.form.get('confidence', 0.5))
        skip_frames = int(request.form.get('skip_frames', 2))  # Обрабатываем каждый 2-й кадр по умолчанию
        extract_frames = request.form.get('extract_frames', 'false').lower() == 'true'
        
        # Создаем временные папки
        temp_dir = Path(__file__).parent / "temp"
        temp_dir.mkdir(exist_ok=True)
        
        # Сохраняем загруженное видео
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        input_filename = f"input_video_{timestamp}.mp4"
        input_path = temp_dir / input_filename
        file.save(str(input_path))
        
        # Путь для выходного видео
        output_filename = f"processed_video_{timestamp}.mp4"
        output_path = temp_dir / output_filename
        
        # Обрабатываем видео
        print(f"Начинаем обработку видео: {input_path}")
        processing_stats = detector.process_video(
            str(input_path), 
            str(output_path), 
            confidence_threshold, 
            skip_frames
        )
        
        # Извлекаем кадры с дефектами (если запрошено)
        extracted_frames = []
        if extract_frames and processing_stats['total_detections'] > 0:
            frames_dir = temp_dir / f"frames_{timestamp}"
            extracted_frames = detector.extract_frames_with_defects(
                str(input_path), 
                str(frames_dir), 
                confidence_threshold, 
                max_frames=5
            )
        
        # Конвертируем обработанное видео в base64 (для небольших видео)
        video_url = None
        if output_path.exists():
            # Возвращаем URL для доступа к файлу
            video_url = f"http://localhost:5000/temp/{output_filename}"
        
        # Конвертируем извлеченные кадры в base64
        frames_base64 = []
        for frame_info in extracted_frames:
            frame_path = Path(frame_info['filename'])
            if frame_path.exists():
                with open(frame_path, 'rb') as img_file:
                    img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
                    frames_base64.append({
                        'timestamp': frame_info['timestamp'],
                        'frame_number': frame_info['frame_number'],
                        'defect_count': frame_info['defect_count'],
                        'image_base64': img_base64,
                        'detections': frame_info['detections']
                    })
        
        # Очищаем временные файлы (кроме обработанного видео)
        try:
            if input_path.exists():
                input_path.unlink()
            # НЕ удаляем output_path, так как он нужен для доступа по URL
        except Exception as e:
            print(f"Ошибка при очистке временных файлов: {e}")
        
        return jsonify({
            'success': True,
            'processing_stats': processing_stats,
            'video_url': video_url,
            'output_filename': output_filename if video_url else None,
            'extracted_frames': frames_base64,
            'summary': {
                'total_frames': processing_stats['total_frames'],
                'processed_frames': processing_stats['processed_frames'],
                'total_detections': processing_stats['total_detections'],
                'defect_types': list(processing_stats['defect_summary'].keys()),
                'defect_counts': processing_stats['defect_summary']
            },
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'error': f'Ошибка обработки видео: {str(e)}',
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
            'POST /api/detect_video',
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


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Возвращает статистику обнаруженных дефектов."""
    if not DATA_STORAGE_PATH.exists():
        return jsonify([])

    try:
        with open(DATA_STORAGE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        app.logger.error(f"Ошибка при чтении файла статистики: {e}")
        return jsonify({"error": "Не удалось загрузить статистику"}), 500

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