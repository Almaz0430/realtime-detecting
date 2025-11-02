import google.generativeai as genai
import os
import time

print("--- [1/4] Загрузка конфигурации Gemini ---")

try:
    # 1. Получаем ключ из окружения
    GEMINI_API_KEY = "AIzaSyC6Ja-qGbZWCDSDEZlPN3gwYMUxAWckhXQ"
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY не найден в переменных окружения.")
        
    # 2. Конфигурируем API
    genai.configure(api_key=GEMINI_API_KEY)
    
    # 3. Инициализируем самую простую модель (без system_prompt)
    model = genai.GenerativeModel('models/gemini-flash-latest')
    
    print("--- [2/4] [OK] Конфигурация загружена ---")
    
    # 4. Делаем запрос
    print("--- [3/4] [>>] Отправка 'Привет' в Gemini... (Ожидание) ---")
    start_time = time.time()
    
    response = model.generate_content("Привет")
    
    end_time = time.time()
    print(f"--- [4/4] [OK] Ответ получен за {end_time - start_time:.2f} сек. ---")
    
    # 5. Печатаем результат
    print("\n--- ОТВЕТ GEMINI ---")
    print(response.text)
    print("--------------------")

except Exception as e:
    print(f"\n[!!!] ПРОИЗОШЛА ОШИБКА: {e}")