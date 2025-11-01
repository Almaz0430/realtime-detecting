#!/usr/bin/env python3
"""
Загрузка датасета неповрежденных автомобилей через kagglehub
"""

import kagglehub
import os
import shutil
from pathlib import Path

def download_undamaged_cars():
    """Загружает датасет неповрежденных автомобилей"""
    print("🚗 Загружаем датасет неповрежденных автомобилей...")
    
    try:
        # Загружаем датасет
        path = kagglehub.dataset_download("garystafford/undamaged-vehicle-image-dataset")
        print(f"✅ Датасет загружен в: {path}")
        
        # Создаем папку для чистых изображений
        clean_dir = Path("./datasets/clean_vehicles/kaggle")
        clean_dir.mkdir(parents=True, exist_ok=True)
        
        # Копируем изображения
        source_path = Path(path)
        image_count = 0
        
        for img_file in source_path.rglob("*"):
            if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                dest_file = clean_dir / f"clean_{image_count:03d}{img_file.suffix}"
                shutil.copy2(img_file, dest_file)
                image_count += 1
                
                if image_count % 10 == 0:
                    print(f"📸 Скопировано: {image_count} изображений")
        
        print(f"🎉 ГОТОВО! Загружено {image_count} чистых изображений")
        print(f"📁 Сохранено в: {clean_dir}")
        
        return clean_dir, image_count
        
    except Exception as e:
        print(f"❌ Ошибка загрузки: {e}")
        return None, 0

def prepare_for_yolo(clean_dir, image_count):
    """Подготавливает изображения для YOLO"""
    print("\n🔄 Подготовка для YOLO...")
    
    # Создаем структуру папок
    merged_dir = Path("./datasets/merged/clean_samples")
    train_dir = merged_dir / "train"
    val_dir = merged_dir / "val"
    
    train_dir.mkdir(parents=True, exist_ok=True)
    val_dir.mkdir(parents=True, exist_ok=True)
    
    # Разделяем 80/20
    train_count = int(image_count * 0.8)
    
    images = list(clean_dir.glob("*.jpg")) + list(clean_dir.glob("*.png"))
    
    # Копируем в train
    for i, img in enumerate(images[:train_count]):
        shutil.copy2(img, train_dir / img.name)
        # Создаем пустую аннотацию
        txt_file = train_dir.parent.parent / "labels" / "train" / f"{img.stem}.txt"
        txt_file.parent.mkdir(parents=True, exist_ok=True)
        txt_file.touch()
    
    # Копируем в val
    for img in images[train_count:]:
        shutil.copy2(img, val_dir / img.name)
        # Создаем пустую аннотацию
        txt_file = val_dir.parent.parent / "labels" / "val" / f"{img.stem}.txt"
        txt_file.parent.mkdir(parents=True, exist_ok=True)
        txt_file.touch()
    
    print(f"📊 Разделение: {train_count} train, {len(images) - train_count} val")
    print(f"📁 Готово в: {merged_dir}")

if __name__ == "__main__":
    print("🚀 Загрузка датасета неповрежденных автомобилей")
    print("=" * 50)
    
    clean_dir, count = download_undamaged_cars()
    
    if clean_dir and count > 0:
        prepare_for_yolo(clean_dir, count)
        print("\n🎯 СЛЕДУЮЩИЙ ШАГ: Переобучение модели")
        print("   python utils/train_model_fixed.py")
    else:
        print("❌ Не удалось загрузить датасет")