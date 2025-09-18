# pip install requests
import json, requests
from django.conf import settings
from typing import Optional

BASE_URL = settings.BASE_URL
API_KEY = settings.API_KEY

def classify(text: str, system: Optional[str] = None, timeout_s: float = 30.0):
    url = f"{BASE_URL}/api/classify"
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
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
    data = r.json()
    print("Model:", data.get("model"))
    print("Output:", data.get("text"))
    print("Usage:", data.get("usage"))
    return data

#if __name__ == "__main__":
#    classify(
#        "Classify: Is this about finance? 'Stock prices rallied after earnings.'",
#        system="You are a strict classifier. Respond briefly."
#    )