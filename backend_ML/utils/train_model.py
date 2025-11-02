#!/usr/bin/env python3
"""
Исправленный скрипт для обучения модели YOLOv8 с автоматическим разделением данных.
"""

import os
import sys
import shutil
import random
from pathlib import Path
import yaml
from ultralytics import YOLO
import torch


class ModelTrainer:
    """Класс для обучения модели YOLOv8 с автоматическим разделением данных"""
    
    def __init__(self):
        # Пути к директориям
        self.base_dir = Path(__file__).parent.parent
        self.datasets_dir = self.base_dir / "datasets" / "merged"
        self.models_dir = self.base_dir / "models"
        
        # Создаем директорию для моделей
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        # Параметры обучения
        self.training_params = {
            'epochs': 80,
            'imgsz': 640,
            'batch': 16,
            'model': 'yolov8n.pt',
            'patience': 10,
            'save_period': 10,
            'device': 0
        }
        
        # Путь к конфигурации датасета
        self.data_yaml = self.datasets_dir / "data.yaml"
        
        # Путь для сохранения обученной модели
        self.output_model_path = self.models_dir / "paint_defect.pt"
    
    def split_dataset(self, val_split=0.2):
        """Разделяет датасет на обучающую и валидационную выборки"""
        print(f"Разделение датасета (валидация: {val_split*100}%)...")
        
        train_images_dir = self.datasets_dir / "images" / "train"
        val_images_dir = self.datasets_dir / "images" / "val"
        train_labels_dir = self.datasets_dir / "labels" / "train"
        val_labels_dir = self.datasets_dir / "labels" / "val"
        
        # Получаем список всех изображений
        all_images = list(train_images_dir.glob("*"))
        
        if len(all_images) == 0:
            raise ValueError("Нет изображений для разделения!")
        
        # Перемешиваем и разделяем
        random.shuffle(all_images)
        val_count = int(len(all_images) * val_split)
        val_images = all_images[:val_count]
        
        print(f"Перемещение {len(val_images)} изображений в валидационную выборку...")
        
        # Перемещаем изображения и соответствующие аннотации
        for img_path in val_images:
            # Перемещаем изображение
            val_img_path = val_images_dir / img_path.name
            shutil.move(str(img_path), str(val_img_path))
            
            # Перемещаем соответствующую аннотацию
            label_name = img_path.stem + ".txt"
            train_label_path = train_labels_dir / label_name
            val_label_path = val_labels_dir / label_name
            
            if train_label_path.exists():
                shutil.move(str(train_label_path), str(val_label_path))
        
        print(f"✅ Разделение завершено:")
        print(f"   Обучающая выборка: {len(list(train_images_dir.glob('*')))} изображений")
        print(f"   Валидационная выборка: {len(list(val_images_dir.glob('*')))} изображений")
    
    def check_dataset(self):
        """Проверяет наличие и корректность датасета"""
        print("Проверка датасета...")
        
        # Проверяем наличие файла конфигурации
        if not self.data_yaml.exists():
            raise FileNotFoundError(
                f"Файл конфигурации датасета не найден: {self.data_yaml}"
            )
        
        # Загружаем конфигурацию
        with open(self.data_yaml, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        
        # Проверяем структуру датасета
        dataset_path = Path(config['path'])
        train_images = dataset_path / config['train']
        val_images = dataset_path / config['val']
        train_labels = dataset_path / "labels" / "train"
        val_labels = dataset_path / "labels" / "val"
        
        # Создаем директории если их нет
        for path in [train_images, val_images, train_labels, val_labels]:
            path.mkdir(parents=True, exist_ok=True)
        
        # Подсчитываем количество файлов
        train_img_count = len(list(train_images.glob("*")))
        val_img_count = len(list(val_images.glob("*")))
        train_lbl_count = len(list(train_labels.glob("*.txt")))
        val_lbl_count = len(list(val_labels.glob("*.txt")))
        
        print(f"✅ Датасет найден:")
        print(f"   Обучающая выборка: {train_img_count} изображений, {train_lbl_count} аннотаций")
        print(f"   Валидационная выборка: {val_img_count} изображений, {val_lbl_count} аннотаций")
        print(f"   Классы: {config['names']}")
        
        # Если валидационная выборка пустая, разделяем данные
        if val_img_count == 0 and train_img_count > 0:
            print("⚠️  Валидационная выборка пустая. Автоматическое разделение...")
            self.split_dataset()
            
            # Пересчитываем после разделения
            train_img_count = len(list(train_images.glob("*")))
            val_img_count = len(list(val_images.glob("*")))
            print(f"✅ После разделения:")
            print(f"   Обучающая выборка: {train_img_count} изображений")
            print(f"   Валидационная выборка: {val_img_count} изображений")
        
        if train_img_count == 0:
            raise ValueError("Обучающая выборка пуста!")
        
        return config
    
    def check_system_requirements(self):
        """Проверяет системные требования для обучения"""
        print("Проверка системных требований...")
        
        # Проверяем доступность CUDA
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            print(f"✅ GPU доступен: {gpu_name} ({gpu_memory:.1f} GB)")
            print(f"   Количество GPU: {gpu_count}")
        else:
            print("⚠️  GPU не доступен, будет использоваться CPU")
            self.training_params['device'] = 'cpu'
    
    def train_model(self):
        """Основной метод обучения модели"""
        print("="*60)
        print("НАЧАЛО ОБУЧЕНИЯ МОДЕЛИ YOLOV8")
        print("="*60)
        
        try:
            # Загружаем предобученную модель
            print(f"Загрузка базовой модели: {self.training_params['model']}")
            model = YOLO(self.training_params['model'])
            
            # Запускаем обучение
            print("Запуск обучения...")
            results = model.train(
                data=str(self.data_yaml),
                epochs=self.training_params['epochs'],
                imgsz=self.training_params['imgsz'],
                batch=self.training_params['batch'],
                patience=self.training_params['patience'],
                save_period=self.training_params['save_period'],
                device=self.training_params['device'],
                project=str(self.models_dir),
                name='paint_defect_training',
                exist_ok=True,
                verbose=True
            )
            
            # Сохраняем лучшую модель
            best_model_path = self.models_dir / "paint_defect_training" / "weights" / "best.pt"
            if best_model_path.exists():
                shutil.copy(str(best_model_path), str(self.output_model_path))
                print(f"✅ Модель сохранена: {self.output_model_path}")
            
            print("="*60)
            print("ОБУЧЕНИЕ ЗАВЕРШЕНО УСПЕШНО!")
            print("="*60)
            
            return results
            
        except Exception as e:
            print(f"❌ Ошибка при обучении: {e}")
            raise
    
    def run(self):
        """Запускает полный процесс обучения"""
        try:
            # Проверяем датасет
            config = self.check_dataset()
            
            # Проверяем системные требования
            self.check_system_requirements()
            
            # Обучаем модель
            results = self.train_model()
            
            return results
            
        except Exception as e:
            print(f"❌ Критическая ошибка: {e}")
            return None


def main():
    """Главная функция"""
    trainer = ModelTrainer()
    results = trainer.run()
    
    if results:
        print("🎉 Обучение модели завершено успешно!")
    else:
        print("💥 Обучение модели завершилось с ошибкой!")
        sys.exit(1)


if __name__ == "__main__":
    main()