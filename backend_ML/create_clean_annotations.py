#!/usr/bin/env python3
"""
Скрипт для создания аннотаций для clean_samples.
Создает аннотации с классом 'clean' (индекс 4) для всех чистых изображений.
"""

import os
from pathlib import Path
from PIL import Image

def create_clean_annotations():
    """Создает аннотации для clean_samples"""
    
    # Пути к папкам
    base_dir = Path(__file__).parent / "datasets" / "merged"
    clean_train_images = base_dir / "clean_samples" / "train"
    clean_val_images = base_dir / "clean_samples" / "val"
    clean_train_labels = base_dir / "labels" / "clean_train"
    clean_val_labels = base_dir / "labels" / "clean_val"
    
    # Создаем папки для аннотаций если их нет
    clean_train_labels.mkdir(parents=True, exist_ok=True)
    clean_val_labels.mkdir(parents=True, exist_ok=True)
    
    def process_images(images_dir, labels_dir, split_name):
        """Обрабатывает изображения в указанной папке"""
        image_files = list(images_dir.glob("*.png")) + list(images_dir.glob("*.jpg"))
        
        print(f"Обработка {split_name}: найдено {len(image_files)} изображений")
        
        for img_path in image_files:
            # Создаем путь к файлу аннотации
            label_path = labels_dir / f"{img_path.stem}.txt"
            
            try:
                # Открываем изображение для получения размеров
                with Image.open(img_path) as img:
                    width, height = img.size
                
                # Создаем аннотацию для класса 'clean' (индекс 4)
                # Покрываем всё изображение: центр (0.5, 0.5), размер (1.0, 1.0)
                annotation = "4 0.5 0.5 1.0 1.0\n"
                
                # Записываем аннотацию
                with open(label_path, 'w') as f:
                    f.write(annotation)
                    
            except Exception as e:
                print(f"Ошибка обработки {img_path}: {e}")
        
        print(f"✅ {split_name}: создано {len(image_files)} аннотаций")
    
    # Обрабатываем train и val
    process_images(clean_train_images, clean_train_labels, "Train")
    process_images(clean_val_images, clean_val_labels, "Val")
    
    print("\n🎉 Все аннотации для clean_samples созданы!")

if __name__ == "__main__":
    create_clean_annotations()