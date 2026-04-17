from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.firefox import GeckoDriverManager
import time

url = "https://maps.app.goo.gl/chV1qiqMcC2uq3n96"

options = Options()
options.add_argument("--headless")
service = Service(GeckoDriverManager().install())
driver = webdriver.Firefox(service=service, options=options)
driver.get(url)

time.sleep(5)  # Sayfanın yüklenmesini bekle

reviews = driver.find_elements(By.CSS_SELECTOR, ".MyEned")
reviews_list = [{"text": review.text} for review in reviews]

import json
with open("reviews.json", "w", encoding="utf-8") as f:
    json.dump(reviews_list, f, ensure_ascii=False, indent=2)

for review in reviews:
    print(review.text)

driver.quit()