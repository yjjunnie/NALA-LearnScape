import json
from app.services.classifier import classify

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_text_from_msg(msg_text_raw):
    try:
        parsed = json.loads(msg_text_raw)
        if isinstance(parsed, list) and parsed and "text" in parsed[0]:
            return parsed[0]["text"]
    except Exception:
        pass
    return None

def classify_messages_from_json(filepath):
    data = load_json(filepath)
    results = []

    # If it's a list of messages
    if isinstance(data, list):
        messages = data
    # If it's a single conversation dict
    elif isinstance(data, dict) and "msg_text" in data:
        messages = [data]
    else:
        print("Unrecognized format")
        return []

    for msg in messages:
        raw_text = msg.get("msg_text")
        extracted_text = extract_text_from_msg(raw_text)
        if not extracted_text:
            continue

        result = classify(extracted_text, system="blooms_taxonomy_classifier")
        tier = result.get("tier")
        confidence = result.get("confidence")

        results.append({
            "text": extracted_text,
            "tier": tier,
            "confidence": confidence
        })

    return results
