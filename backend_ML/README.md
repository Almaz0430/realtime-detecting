# Paint Defect Detection System

Система обнаружения дефектов окраски автомобилей на основе YOLOv8 и Roboflow.

## Описание

Этот проект представляет собой backend REST API для обнаружения дефектов окраски автомобилей. Система включает в себя:

- Объединение датасетов из Roboflow
- Обучение модели YOLOv8
- REST API для обнаружения дефектов на изображениях

### Поддерживаемые классы дефектов:
- `scratch` - царапины
- `dent` - вмятины  
- `runs` - подтеки краски
- `bubbling` - пузыри

## Установка

### 1. Клонирование и настройка окружения

```bash
cd backend_ML
pip install -r requirements.txt
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Отредактируйте `.env` файл и добавьте ваш API ключ Roboflow:

```
ROBOFLOW_API_KEY=your_roboflow_api_key_here
```

## Использование

### 1. Объединение датасетов

Для объединения датасетов из Roboflow выполните:

```bash
python utils/merge_datasets.py
```

Скрипт:
- Скачает датасеты через Roboflow API
- Объединит аннотации в формат YOLOv8
- Создаст единый датасет в папке `datasets/merged/`
- Сгенерирует файл `data.yaml` с конфигурацией

### 2. Обучение модели

Для обучения модели YOLOv8 выполните:

```bash
python utils/train_model.py
```

Параметры обучения:
- Модель: YOLOv8n
- Эпохи: 50
- Размер изображения: 640x640
- Размер батча: 16 (автоматически адаптируется под доступную память)

Обученная модель будет сохранена в `models/paint_defect.pt`.

### 3. Запуск REST API

Для запуска API сервера выполните:

```bash
python app.py
```

API будет доступен по адресу: `http://localhost:5000`

## API Endpoints

### GET /
Информация о API и доступных endpoints.

**Ответ:**
```json
{
    "name": "Paint Defect Detection API",
    "version": "1.0.0",
    "description": "REST API для обнаружения дефектов окраски автомобилей",
    "endpoints": {
        "POST /api/detect": "Обнаружение дефектов на изображении",
        "GET /api/model_info": "Информация о модели",
        "GET /api/health": "Проверка состояния API"
    },
    "model_loaded": true,
    "timestamp": "2024-01-01T12:00:00"
}
```

### POST /api/detect
Обнаружение дефектов на загруженном изображении.

**Параметры:**
- `image` (file): Изображение для анализа (JPG, PNG, JPEG)

**Пример запроса:**
```bash
curl -X POST -F "image=@car_image.jpg" http://localhost:5000/api/detect
```

**Ответ:**
```json
{
    "success": true,
    "detections": [
        {
            "class": "scratch",
            "confidence": 0.85,
            "bbox": [100, 150, 200, 250]
        }
    ],
    "class_counts": {
        "scratch": 1,
        "dent": 0,
        "runs": 0,
        "bubbling": 0
    },
    "total_defects": 1,
    "image_with_detections": "base64_encoded_image_string"
}
```

### GET /api/model_info
Информация о загруженной модели.

**Ответ:**
```json
{
    "model_loaded": true,
    "model_path": "models/paint_defect.pt",
    "classes": ["scratch", "dent", "runs", "bubbling"],
    "input_size": [640, 640]
}
```

### GET /api/health
Проверка состояния API.

**Ответ:**
```json
{
    "status": "healthy",
    "model_loaded": true,
    "timestamp": "2024-01-01T12:00:00"
}
```

## Структура проекта

```
backend_ML/
├── app.py                 # Flask REST API
├── requirements.txt       # Зависимости Python
├── .env.example          # Пример файла окружения
├── README.md             # Документация
├── utils/
│   ├── merge_datasets.py # Объединение датасетов
│   └── train_model.py    # Обучение модели
├── datasets/
│   ├── raw/              # Исходные датасеты
│   └── merged/           # Объединенный датасет
│       ├── images/
│       │   ├── train/
│       │   └── val/
│       ├── labels/
│       │   ├── train/
│       │   └── val/
│       └── data.yaml
└── models/
    └── paint_defect.pt   # Обученная модель
```

## Требования к системе

- Python 3.8+
- CUDA (опционально, для GPU ускорения)
- Минимум 4GB RAM
- Минимум 2GB свободного места на диске

## Обработка ошибок

API возвращает соответствующие HTTP коды состояния:

- `200` - Успешный запрос
- `400` - Неверный запрос (отсутствует файл, неподдерживаемый формат)
- `404` - Endpoint не найден
- `413` - Файл слишком большой (максимум 16MB)
- `500` - Внутренняя ошибка сервера

## Логирование

Все операции логируются в консоль с указанием времени и уровня важности сообщения.

## Поддержка

При возникновении проблем проверьте:

1. Правильность API ключа Roboflow в `.env` файле
2. Наличие обученной модели в `models/paint_defect.pt`
3. Корректность формата загружаемых изображений
4. Доступность необходимых зависимостей

## Лицензия

Этот проект предназначен для внутреннего использования.