import json
from app.services.classifier import classify

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_text_from_msg(msg_text_raw):
    if not isinstance(msg_text_raw, str):
        return msg_text_raw # if not a string, return the msg as it is
    try: # first try to parse it as JSON (for user messages)
        parsed = json.loads(msg_text_raw)
        if isinstance(parsed, list) and parsed and "text" in parsed[0]:
            return parsed[0]["text"]
    except json.JSONDecodeError:
        # if this fails, plain string (for assistant messages) would be extracted, so js the raw text would be extracted 
        return msg_text_raw
    return msg_text_raw

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
        return []

    for index, msg in enumerate(messages):
        raw_text = msg.get("msg_text")
        extracted_text = extract_text_from_msg(raw_text)
        if not extracted_text:
            continue
        
        result = classify(extracted_text, system="You are a strict classifier. Classify the user's text into one Bloom's taxonomy level from this set: [Remember, Understand, Apply, Analyze, Evaluate, Create]. Choose EXACTLY ONE best label. Return ONLY a compact JSON string with keys: \"labels\" (array with one element), \"scores\" (object with a confidence for the chosen label in [0,1]), and \"reasoning\" (very short).")

        data = result.get("text")
        try:
            # clean and parse the data from the classify function's data's text output
            # find the start of the JSON object '{' and the end '}'
            start = data.find('{')
            end = data.rfind('}') + 1
            
            # get clean JSON string
            json_string = data[start:end]
            
            # convert the string into a python dictionary
            parsed_data = json.loads(json_string)

            tier = parsed_data.get('labels')
            confidence = parsed_data.get('scores')
            reasoning = parsed_data.get('reasoning')

            results.append({
                "text": extracted_text,
                "tier": tier,
                "confidence": confidence,
                "reasoning": reasoning
            })
        except (json.JSONDecodeError, IndexError):
            labels = None

    return results