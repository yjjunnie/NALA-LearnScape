#read:topics → GET /api/topiclist
#read:history → GET /api/chathistory
# write:history → POST /api/chathistory
# classify:run → POST /api/classify

# pip install requests
import os
import requests

BASE_URL = os.getenv("BASE_URL", "https://nala.ntu.edu.sg")
API_KEY = os.getenv("API_KEY", "pk_SleepDeprivedAtFour_11adfhkl9903")

def get_topic_list(chatbot_id=3, timeout=15):
    url = f"{BASE_URL}/api/topiclist"
    headers = {"X-API-Key": API_KEY}
    params = {"chatbot_id": chatbot_id}
    resp = requests.get(url, headers=headers, params=params, timeout=timeout)

    try:
        resp.raise_for_status()
    except requests.HTTPError:
        try:
            print("Error body:", resp.json())
        except Exception:
            print("Error text:", resp.text)
        raise

    data = resp.json()
    print("Chatbot:", data.get("chatbot_id"))
    print("Topics:", data.get("topic_list"))
    return data

if __name__ == "__main__":
    get_topic_list(3)
