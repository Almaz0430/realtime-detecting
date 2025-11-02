#!/usr/bin/env python3
"""
Тестовый скрипт для проверки API обработки видео
"""

import requests
import json
import base64
from pathlib import Path

def test_video_detection(video_path: str, server_url: str = "http://localhost:5000"):
    """
    Тестирует API обнаружения дефектов в видео
    
    Args:
        video_path: путь к видеофайлу
        server_url: URL сервера API
    """
    
    # Проверяем существование файла
    video_file = Path(video_path)
    if not video_file.exists():
        print(f"❌ Видеофайл не найден: {video_path}")
        return
    
    print(f"🎬 Тестируем обработку видео: {video_file.name}")
    print(f"📁 Размер файла: {video_file.stat().st_size / (1024*1024):.2f} MB")
    
    # Подготавливаем данные для отправки
    url = f"{server_url}/api/detect_video"
    
    files = {
        'video': open(video_path, 'rb')
    }
    
    data = {
        'confidence': '0.5',
        'skip_frames': '2',
        'extract_frames': 'true'
    }
    
    try:
        print("🚀 Отправляем видео на сервер...")
        response = requests.post(url, files=files, data=data, timeout=300)  # 5 минут таймаут
        
        if response.status_code == 200:
            result = response.json()
            
            if result['success']:
                print("✅ Обработка завершена успешно!")
                
                # Выводим статистику
                stats = result['processing_stats']
                summary = result['summary']
                
                print(f"\n📊 Статистика обработки:")
                print(f"   Всего кадров: {stats['total_frames']}")
                print(f"   Обработано кадров: {stats['processed_frames']}")
                print(f"   Найдено дефектов: {stats['total_detections']}")
                
                if summary['defect_counts']:
                    print(f"\n🔍 Типы дефектов:")
                    for defect_type, count in summary['defect_counts'].items():
                        print(f"   {defect_type}: {count}")
                else:
                    print("\n✨ Дефектов не обнаружено!")
                
                # Информация о видео
                if result['video_base64']:
                    print(f"\n🎥 Обработанное видео получено (base64)")
                    
                    # Сохраняем видео
                    output_path = Path("processed_video_output.mp4")
                    with open(output_path, 'wb') as f:
                        f.write(base64.b64decode(result['video_base64']))
                    print(f"   Сохранено как: {output_path}")
                
                # Информация о кадрах
                if result['extracted_frames']:
                    print(f"\n🖼️  Извлечено кадров с дефектами: {len(result['extracted_frames'])}")
                    
                    frames_dir = Path("extracted_frames")
                    frames_dir.mkdir(exist_ok=True)
                    
                    for i, frame_data in enumerate(result['extracted_frames']):
                        frame_path = frames_dir / f"frame_{i+1}_{frame_data['timestamp']:.2f}s.jpg"
                        with open(frame_path, 'wb') as f:
                            f.write(base64.b64decode(frame_data['image_base64']))
                        
                        print(f"   Кадр {i+1}: {frame_data['timestamp']:.2f}s, дефектов: {frame_data['defect_count']}")
                        print(f"     Сохранен: {frame_path}")
                
            else:
                print(f"❌ Ошибка обработки: {result.get('error', 'Неизвестная ошибка')}")
        
        else:
            print(f"❌ HTTP ошибка: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Детали: {error_data.get('error', 'Нет деталей')}")
            except:
                print(f"   Ответ: {response.text}")
    
    except requests.exceptions.Timeout:
        print("⏰ Превышен таймаут запроса (5 минут)")
    except requests.exceptions.ConnectionError:
        print("🔌 Ошибка подключения к серверу")
        print("   Убедитесь, что сервер запущен: python app.py")
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
    
    finally:
        files['video'].close()


def check_server_status(server_url: str = "http://localhost:5000"):
    """Проверяет статус сервера"""
    
    try:
        response = requests.get(f"{server_url}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Сервер работает")
            print(f"   Модель загружена: {data.get('model_loaded', False)}")
            return True
        else:
            print(f"❌ Сервер недоступен: HTTP {response.status_code}")
            return False
    except:
        print("❌ Сервер не отвечает")
        return False


if __name__ == "__main__":
    print("="*60)
    print("ТЕСТ API ОБРАБОТКИ ВИДЕО")
    print("="*60)
    
    # Проверяем статус сервера
    if not check_server_status():
        print("\n💡 Для запуска сервера выполните:")
        print("   cd backend_ML")
        print("   python app.py")
        exit(1)
    
    # Запрашиваем путь к видео
    video_path = input("\n📁 Введите путь к видеофайлу: ").strip().strip('"')
    
    if not video_path:
        print("❌ Путь к файлу не указан")
        exit(1)
    
    # Тестируем обработку
    test_video_detection(video_path)
    
    print("\n" + "="*60)
    print("ТЕСТ ЗАВЕРШЕН")
    print("="*60)