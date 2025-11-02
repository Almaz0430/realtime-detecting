package main

import (
	"fmt"
	"image"
	"image/png" 
	"io"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// --- Настройки Аугментации ---

const minCropPercent = 0.6

const maxCropPercent = 0.9

type subImager interface {
	SubImage(r image.Rectangle) image.Image
}

func main() {
	rand.New(rand.NewSource(time.Now().UnixNano()))

	if len(os.Args) != 3 {
		fmt.Println("Использование: go run augment_quadrant.go <source_directory> <destination_directory>")
		os.Exit(1)
	}

	sourceDir := os.Args[1]
	destDir := os.Args[2]

	if err := os.MkdirAll(destDir, 0755); err != nil {
		log.Fatalf("Не удалось создать папку назначения: %v", err)
	}

	fmt.Printf("Сканирование %s...\n", sourceDir)

	err := filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		if strings.HasSuffix(strings.ToLower(info.Name()), ".png") {
			fmt.Printf("-> Обработка: %s\n", path)
			err := processImage(path, destDir)
			if err != nil {
				fmt.Printf("  [!] Ошибка обработки %s: %v\n", path, err)
			}
		}
		return nil
	})

	if err != nil {
		log.Fatalf("Ошибка при обходе директории: %v", err)
	}
	fmt.Println("\nАугментация завершена.")
}

// processImage открывает, обрезает (2 раза) и сохраняет изображение
func processImage(sourcePath string, destDir string) error {
	file, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("не удалось открыть файл: %w", err)
	}
	defer file.Close()

	img, err := png.Decode(file)
	if err != nil {
		if err == io.EOF || err.Error() == "png: invalid format: not a PNG file" {
			return fmt.Errorf("не PNG файл")
		}
		return fmt.Errorf("не удалось декодировать png: %w", err)
	}

	cropper, ok := img.(subImager)
	if !ok {
		return fmt.Errorf("тип изображения не поддерживает SubImage")
	}

	bounds := img.Bounds()
	origWidth := bounds.Dx()
	origHeight := bounds.Dy()

	// === КРОП 1: Левый Верхний Квадрант ===
	{
		// 1. Случайный размер
		cropWidth1 := int(float64(origWidth) * (minCropPercent + rand.Float64()*(maxCropPercent-minCropPercent)))
		cropHeight1 := int(float64(origHeight) * (minCropPercent + rand.Float64()*(maxCropPercent-minCropPercent)))

		if origWidth > cropWidth1 && origHeight > cropHeight1 {
			// 2. Случайная точка старта в пределах верхнего левого квадранта
			// Мы делим "свободное пространство" (origWidth - cropWidth1) пополам
			maxX := (origWidth - cropWidth1) / 2
			maxY := (origHeight - cropHeight1) / 2

			// Проверка, что есть место для выбора
			if maxX <= 0 { maxX = 1 }
			if maxY <= 0 { maxY = 1 }

			startX1 := rand.Intn(maxX)
			startY1 := rand.Intn(maxY)

			// 3. Прямоугольник кропа
			cropRect1 := image.Rect(
				startX1,
				startY1,
				startX1+cropWidth1,
				startY1+cropHeight1,
			).Add(bounds.Min)

			// 4. Обрезка
			croppedImg1 := cropper.SubImage(cropRect1)

			// 5. Сохранение
			saveCroppedImage(croppedImg1, sourcePath, destDir, 1)
		} else {
			fmt.Printf("  [!] Пропуск кропа 1 для %s: изображение слишком мало\n", sourcePath)
		}
	}

	// === КРОП 2: Правый Нижний Квадрант ===
	{
		// 1. Случайный размер (может отличаться от первого)
		cropWidth2 := int(float64(origWidth) * (minCropPercent + rand.Float64()*(maxCropPercent-minCropPercent)))
		cropHeight2 := int(float64(origHeight) * (minCropPercent + rand.Float64()*(maxCropPercent-minCropPercent)))

		if origWidth > cropWidth2 && origHeight > cropHeight2 {
			// 2. Случайная точка старта в пределах правого нижнего квадранта
			// Мы начинаем с "середины" и добавляем случайное значение из второй половины
			halfFreeX := (origWidth - cropWidth2) / 2
			halfFreeY := (origHeight - cropHeight2) / 2

			if halfFreeX <= 0 { halfFreeX = 1 }
			if halfFreeY <= 0 { halfFreeY = 1 }

			startX2 := halfFreeX + rand.Intn(halfFreeX)
			startY2 := halfFreeY + rand.Intn(halfFreeY)

			// 3. Прямоугольник кропа
			cropRect2 := image.Rect(
				startX2,
				startY2,
				startX2+cropWidth2,
				startY2+cropHeight2,
			).Add(bounds.Min)

			// 4. Обрезка
			croppedImg2 := cropper.SubImage(cropRect2)

			// 5. Сохранение
			saveCroppedImage(croppedImg2, sourcePath, destDir, 2)
		} else {
			fmt.Printf("  [!] Пропуск кропа 2 для %s: изображение слишком мало\n", sourcePath)
		}
	}

	return nil
}

// вспомогательная функция для сохранения файла
func saveCroppedImage(img image.Image, sourcePath string, destDir string, cropNumber int) {
	// Создаем новое имя файла
	baseName := filepath.Base(sourcePath)
	ext := filepath.Ext(baseName)
	nameOnly := strings.TrimSuffix(baseName, ext)

	newFileName := fmt.Sprintf("%s_crop_%d%s", nameOnly, cropNumber, ext)
	destPath := filepath.Join(destDir, newFileName)

	outFile, err := os.Create(destPath)
	if err != nil {
		fmt.Printf("  [!] Не удалось создать файл %s: %v\n", destPath, err)
		return
	}
	defer outFile.Close() // Гарантируем закрытие файла

	// Кодируем в PNG и сохраняем
	err = png.Encode(outFile, img)
	if err != nil {
		fmt.Printf("  [!] Не удалось сохранить %s: %v\n", destPath, err)
	}
}