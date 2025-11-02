#!/usr/bin/env python3
"""
Скрипт для объединения датасетов Roboflow в единый формат YOLOv8
для обнаружения дефектов окраски автомобилей.
"""

import os
import sys
import shutil
import zipfile
import yaml
import json
from pathlib import Path
from typing import Dict, List, Tuple
import requests
from dotenv import load_dotenv
from roboflow import Roboflow

# Загружаем переменные окружения
load_dotenv()

class DatasetMerger:
    """Класс для объединения датасетов Roboflow"""
    
    def __init__(self):
        self.api_key = os.getenv('ROBOFLOW_API_KEY')
        if not self.api_key:
            raise ValueError("ROBOFLOW_API_KEY не найден в .env файле")
        
        self.rf = Roboflow(api_key=self.api_key)
        
        # Пути к директориям
        self.base_dir = Path(__file__).parent.parent
        self.raw_dir = self.base_dir / "datasets" / "raw"
        self.merged_dir = self.base_dir / "datasets" / "merged"
        
        # Создаем директории если их нет
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.merged_dir.mkdir(parents=True, exist_ok=True)
        
        # Целевые классы для объединенного датасета
        self.target_classes = [
            'scratch',          # царапины
            'dent',            # вмятины
            'runs',            # подтёки краски
            'bubbling'         # пузыри
        ]
        
        # Маппинг классов из разных датасетов к целевым классам
        self.class_mapping = {
            # Общие маппинги для различных вариантов названий
            'scratch': 'scratch',
            'scratches': 'scratch',
            'dent': 'dent',
            'dents': 'dent',
            'paint_run': 'runs',
            'paint_runs': 'runs',
            'runs': 'runs',
            'bubbling': 'bubbling',
            'bubble': 'bubbling',
            
            # Возможные варианты из датасетов
            'damage': 'dent',
            'car_damage': 'dent',
            'paint_damage': 'runs',
        }
        
        # Список URL датасетов Roboflow
        self.dataset_urls = [
            "https://universe.roboflow.com/poli-h7nww/final-year-car-paint-defect",
            "https://universe.roboflow.com/politeknik-sultan-azlan-shah/car-paint-surface-defect",
            "https://universe.roboflow.com/car-paint/paint-defects-u2wuj-efv9m",
            "https://universe.roboflow.com/ai-proyect/car-damages-kaggle"
        ]
    
    def extract_dataset_info(self, url: str) -> Tuple[str, str]:
        """Извлекает workspace и project из URL Roboflow"""
        parts = url.split('/')
        workspace = parts[-2]
        project = parts[-1].split('?')[0]  # Убираем query параметры
        return workspace, project
    
    def download_dataset(self, workspace: str, project: str, version: int = 1) -> Path:
        """Скачивает датасет из Roboflow"""
        print(f"Скачивание датасета {workspace}/{project}...")
        
        try:
            # Получаем проект
            project_obj = self.rf.workspace(workspace).project(project)
            
            # Скачиваем датасет в формате YOLOv8
            dataset_dir = self.raw_dir / f"{workspace}_{project}"
            
            # Удаляем существующую директорию если есть
            if dataset_dir.exists():
                shutil.rmtree(dataset_dir)
            
            dataset = project_obj.version(version).download("yolov8", location=str(dataset_dir))
            
            print(f"Датасет {workspace}/{project} успешно скачан в {dataset_dir}")
            return dataset_dir
            
        except Exception as e:
            print(f"Ошибка при скачивании {workspace}/{project}: {e}")
            return None
    
    def load_yaml_config(self, dataset_dir: Path) -> Dict:
        """Загружает конфигурацию YAML датасета"""
        yaml_files = list(dataset_dir.glob("*.yaml")) + list(dataset_dir.glob("data.yaml"))
        
        if not yaml_files:
            print(f"Файл data.yaml не найден в {dataset_dir}")
            return None
        
        yaml_file = yaml_files[0]
        with open(yaml_file, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        
        return config
    
    def map_class_names(self, original_classes: List[str]) -> Dict[int, int]:
        """Создает маппинг индексов классов из оригинального в целевой формат"""
        class_map = {}
        
        for orig_idx, orig_class in enumerate(original_classes):
            # Приводим к нижнему регистру и убираем пробелы
            clean_class = orig_class.lower().strip().replace(' ', '_')
            
            # Ищем соответствие в маппинге
            target_class = self.class_mapping.get(clean_class)
            
            if target_class and target_class in self.target_classes:
                target_idx = self.target_classes.index(target_class)
                class_map[orig_idx] = target_idx
                print(f"Маппинг класса: {orig_class} ({orig_idx}) -> {target_class} ({target_idx})")
            else:
                print(f"Класс {orig_class} не найден в маппинге, пропускаем")
        
        return class_map
    
    def convert_annotations(self, dataset_dir: Path, class_map: Dict[int, int], split: str):
        """Конвертирует аннотации с учетом маппинга классов"""
        labels_dir = dataset_dir / split / "labels"
        images_dir = dataset_dir / split / "images"
        
        if not labels_dir.exists() or not images_dir.exists():
            print(f"Директории {split} не найдены в {dataset_dir}")
            return
        
        # Целевые директории - преобразуем 'valid' в 'val'
        target_split = 'val' if split == 'valid' else split
        target_images_dir = self.merged_dir / "images" / target_split
        target_labels_dir = self.merged_dir / "labels" / target_split
        
        target_images_dir.mkdir(parents=True, exist_ok=True)
        target_labels_dir.mkdir(parents=True, exist_ok=True)
        
        # Обрабатываем каждый файл аннотации
        for label_file in labels_dir.glob("*.txt"):
            image_name = label_file.stem
            
            # Ищем соответствующее изображение
            image_files = list(images_dir.glob(f"{image_name}.*"))
            if not image_files:
                continue
            
            image_file = image_files[0]
            
            # Читаем и конвертируем аннотации
            converted_lines = []
            with open(label_file, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        orig_class_id = int(parts[0])
                        
                        # Проверяем есть ли маппинг для этого класса
                        if orig_class_id in class_map:
                            new_class_id = class_map[orig_class_id]
                            # Заменяем ID класса
                            parts[0] = str(new_class_id)
                            converted_lines.append(' '.join(parts))
            
            # Сохраняем только если есть валидные аннотации
            if converted_lines:
                # Копируем изображение
                target_image_path = target_images_dir / image_file.name
                shutil.copy2(image_file, target_image_path)
                
                # Сохраняем конвертированные аннотации
                target_label_path = target_labels_dir / label_file.name
                with open(target_label_path, 'w') as f:
                    f.write('\n'.join(converted_lines) + '\n')
    
    def process_dataset(self, dataset_dir: Path):
        """Обрабатывает один датасет"""
        print(f"Обработка датасета: {dataset_dir}")
        
        # Загружаем конфигурацию
        config = self.load_yaml_config(dataset_dir)
        if not config:
            return
        
        # Получаем список классов
        original_classes = config.get('names', [])
        if not original_classes:
            print(f"Классы не найдены в конфигурации {dataset_dir}")
            return
        
        print(f"Найдены классы: {original_classes}")
        
        # Создаем маппинг классов
        class_map = self.map_class_names(original_classes)
        if not class_map:
            print(f"Не удалось создать маппинг классов для {dataset_dir}")
            return
        
        # Обрабатываем train и valid splits
        for split in ['train', 'valid']:
            self.convert_annotations(dataset_dir, class_map, split)
    
    def create_merged_yaml(self):
        """Создает файл data.yaml для объединенного датасета"""
        yaml_config = {
            'path': str(self.merged_dir.absolute()),
            'train': 'images/train',
            'val': 'images/val',
            'nc': len(self.target_classes),
            'names': self.target_classes
        }
        
        yaml_path = self.merged_dir / "data.yaml"
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(yaml_config, f, default_flow_style=False, allow_unicode=True)
        
        print(f"Создан файл конфигурации: {yaml_path}")
        return yaml_path
    
    def validate_dataset(self):
        """Проверяет корректность датасета с помощью YOLO"""
        try:
            from ultralytics import YOLO
            
            print("Проверка корректности датасета...")
            yaml_path = self.merged_dir / "data.yaml"
            
            # Создаем модель для проверки
            model = YOLO('yolov8n.pt')
            
            # Запускаем dry-run обучения
            results = model.train(
                data=str(yaml_path),
                epochs=1,
                imgsz=640,
                batch=1,
                verbose=False,
                dry_run=True
            )
            
            print("✅ Датасет прошел проверку корректности!")
            return True
            
        except Exception as e:
            print(f"❌ Ошибка при проверке датасета: {e}")
            return False
    
    def get_dataset_stats(self):
        """Выводит статистику объединенного датасета"""
        train_images = len(list((self.merged_dir / "images" / "train").glob("*")))
        val_images = len(list((self.merged_dir / "images" / "val").glob("*")))
        train_labels = len(list((self.merged_dir / "labels" / "train").glob("*.txt")))
        val_labels = len(list((self.merged_dir / "labels" / "val").glob("*.txt")))
        
        print("\n" + "="*50)
        print("СТАТИСТИКА ОБЪЕДИНЕННОГО ДАТАСЕТА")
        print("="*50)
        print(f"Обучающая выборка: {train_images} изображений, {train_labels} аннотаций")
        print(f"Валидационная выборка: {val_images} изображений, {val_labels} аннотаций")
        print(f"Всего: {train_images + val_images} изображений")
        print(f"Классы: {', '.join(self.target_classes)}")
        print("="*50)
    
    def merge_all_datasets(self):
        """Основной метод для объединения всех датасетов"""
        print("Начинаем объединение датасетов Roboflow...")
        
        # Очищаем директорию объединенного датасета
        if self.merged_dir.exists():
            shutil.rmtree(self.merged_dir)
        self.merged_dir.mkdir(parents=True, exist_ok=True)
        
        # Создаем поддиректории
        for split in ['train', 'val']:
            (self.merged_dir / "images" / split).mkdir(parents=True, exist_ok=True)
            (self.merged_dir / "labels" / split).mkdir(parents=True, exist_ok=True)
        
        # Обрабатываем каждый датасет
        for url in self.dataset_urls:
            try:
                workspace, project = self.extract_dataset_info(url)
                dataset_dir = self.download_dataset(workspace, project)
                
                if dataset_dir:
                    self.process_dataset(dataset_dir)
                    
            except Exception as e:
                print(f"Ошибка при обработке {url}: {e}")
                continue
        
        # Создаем конфигурационный файл
        self.create_merged_yaml()
        
        # Выводим статистику
        self.get_dataset_stats()
        
        # Проверяем корректность
        self.validate_dataset()
        
        print("\n✅ Объединение датасетов завершено!")


def main():
    """Главная функция"""
    try:
        merger = DatasetMerger()
        merger.merge_all_datasets()
        
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()