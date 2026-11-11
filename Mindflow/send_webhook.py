import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("WEBHOOK_API_KEY")
url = "https://call-github.bkpxmb.easypanel.host/webhook"
headers = {
    "X-API-Key": api_key,
    "Content-Type": "application/json"
}

import json
with open("payload.json", "r", encoding="utf-8") as f:
    payload = json.load(f)

response = requests.post(url, json=payload, headers=headers)
print(response.status_code)
print(response.text)
