import json
from app.services.classifier import classify

#1. classify the conversation history of the user n deem it as the one of the different bloom's taxomy tiers

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
        if msg.get("msg_sender") != "user":
            continue

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

#2. display chat history with newconvohistory.json with linear algebra content

def loading_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                return {"error": f"{filepath} is empty"}
            return json.loads(content)
    except FileNotFoundError:
        return {"error": f"File not found: {filepath}"}
    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON in {filepath}", "details": str(e)}


def display_messages_from_json(filepath):
    data = loading_json(filepath)
    return data

#3. generate percentage of topics asked in the linear algebra content; we have four topics: Introducing the Matrix, Linear Transforms and the Matrix, Manipulating the Matrix, Inverting the Matrix

def percentage_from_json(filepath):
    total_count = 0
    topic1_count, topic2_count, topic3_count, topic4_count = 0, 0, 0, 0

    data = load_json(filepath)
    results = []

    # If it's a list of messages
    if isinstance(data, list):
        messages = data
    elif isinstance(data, dict) and "msg_text" in data:  
        messages = [data]
    else:
        return []

    for msg in messages:
        if msg.get("msg_sender") != "user":
            continue

        raw_text = msg.get("msg_text")
        extracted_text = extract_text_from_msg(raw_text)
        if not extracted_text:
            continue

        result = classify(extracted_text,system=(
                "You are a strict classifier. Classify the user's text into one linear algebra topic "
                "from this set: [topic1: Introducing the Matrix, topic2: Linear Transforms and the Matrix, "
                "topic3: Manipulating the Matrix, topic4: Inverting the Matrix]. "
                "Choose EXACTLY ONE best label, unclassifiable is NOT ALLOWED. Return ONLY a compact JSON string with keys: \"labels\" (array with one element)"
            ),
        )
        result = result.get("text")

        try:
            # clean and parse the data from classify output
            start = result.find("{")
            end = result.rfind("}") + 1
            json_string = result[start:end]
            parsed_data = json.loads(json_string)

            label = parsed_data.get("labels", [None])[0]  # grab first element safely
            print(label)
            if label == "topic1: Introducing the Matrix":
                topic1_count += 1
            elif label == "topic2: Linear Transforms and the Matrix":
                topic2_count += 1
            elif label == "topic3: Manipulating the Matrix":
                topic3_count += 1
            elif label == "topic4: Inverting the Matrix":
                topic4_count += 1
            total_count += 1

        except (json.JSONDecodeError, IndexError, TypeError):
            continue  # skip invalid classification outputs

    if total_count == 0:  # avoid division by zero
        return [{"error": "No user messages found"}]

    results.append({
        "Introducing the Matrix": round((topic1_count / total_count) * 100, 2),
        "Linear Transforms and the Matrix": round((topic2_count / total_count) * 100, 2),
        "Manipulating the Matrix": round((topic3_count / total_count) * 100, 2),
        "Inverting the Matrix": round((topic4_count / total_count) * 100, 2),
        "total_user_messages": total_count
    })

    return results



