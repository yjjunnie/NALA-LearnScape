import os, json, requests
from django.conf import settings

BASE_URL = settings.BASE_URL
API_KEY = settings.API_KEY

def llm(text, system=None, timeout_s=30):
    url = f"{BASE_URL}/api/llm"
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    payload = {"text": text}
    if system:
        payload["system"] = system
    
    r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=timeout_s)
    
    if not r.ok:
        try:
            print("Error body:", r.json())
        except Exception:
            print("Error text:", r.text)
        r.raise_for_status()
    
    return r.json()
