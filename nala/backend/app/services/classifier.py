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
    try:
        r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=timeout_s)
        if not r.ok:
            # Try to print server's message for debugging
            try:
                print("Error body:", r.json())
            except Exception:
                print("Error text:", r.text)
            # Return structured error instead of raising to avoid 500s upstream
            return {
                "error": f"HTTP {r.status_code}",
                "status": r.status_code,
                "text": None,
            }
        data = r.json()
        print("Model:", data.get("model"))
        print("Output:", data.get("text"))
        print("Usage:", data.get("usage"))
        return data
    except requests.RequestException as e:
        # Network/timeout or other requests-level error
        return {
            "error": str(e),
            "status": None,
            "text": None,
        }