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

#4. time spent per topic

from datetime import datetime
import json

def calculate_time_spent_per_topic(filepath):
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

    # filter for user messages only
    user_msgs = [msg for msg in messages if msg.get("msg_sender") == "user"]

    # sort by timestamp just in case
    user_msgs.sort(key=lambda x: x["msg_timestamp"])

    time_spent = {
        "Introducing the Matrix": 0,
        "Linear Transforms and the Matrix": 0,
        "Manipulating the Matrix": 0,
        "Inverting the Matrix": 0
    }

    for i in range(len(user_msgs) - 1):
        current_msg = user_msgs[i]
        next_msg = user_msgs[i + 1]

        raw_text = current_msg.get("msg_text")
        extracted_text = extract_text_from_msg(raw_text)
        if not extracted_text:
            continue

        # parse timestamps
        t1 = datetime.fromisoformat(current_msg["msg_timestamp"].replace("Z", "+00:00"))
        t2 = datetime.fromisoformat(next_msg["msg_timestamp"].replace("Z", "+00:00"))
        duration = (t2 - t1).total_seconds()

        # classify into one of the four topics
        result = classify(
            extracted_text,
            system="You are a strict classifier. Classify the user's text into one linear algebra topic from this set: [Introducing the Matrix, Linear Transforms and the Matrix, Manipulating the Matrix, Inverting the Matrix]. Choose EXACTLY ONE best label. Return ONLY a compact JSON string with keys: \"labels\" (array with one element)."
        )

        data = result.get("text")
        try:
            start = data.find('{')
            end = data.rfind('}') + 1
            json_string = data[start:end]
            parsed_data = json.loads(json_string)

            topic = parsed_data.get('labels')[0]
            time_spent[topic] += duration
        except (json.JSONDecodeError, IndexError, TypeError):
            continue

    total_time = sum(time_spent.values())
    for topic, secs in time_spent.items():
        results.append({
            "topic": topic,
            "seconds": secs,
            "percentage": secs / total_time if total_time else 0
        })

    return results


# 5. learning style based on entire user chat history

def learning_style_from_json(filepath):
    total_count = 0
    retrieval_practice_count = 0
    elaboration_count = 0
    concrete_examples_count = 0
    interleaving_count = 0
    dual_coding_count = 0

    data = load_json(filepath)
    results = []

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
        if not raw_text:
            continue

        learning_style = classify(raw_text, system="You are a strict classifier. Classify the user's text into one of the following learning styles: [Retrieval Practice, Elaboration, Concrete Examples, Interleaving, Dual Coding], where"
        "Retrieval Practice: Testing yourself to strengthen memory and recall,"
        "Elaboration: Explaining discrete ideas with many details,"
        "Concrete Examples: Using specific examples to understand abstract ideas,"
        "Interleaving: Mixing different topics or skills during study sessions and the topics here are firstly, Introducing the Matrix then,"
        "Linear Transforms and the Matrix then,"
        "Manipulating the Matrix then lastly,"
        "Inverting the Matrix, so if the user's text is about any of two or more of these topics mentioned at the same time, classify it as Interleaving."
        "Dual Coding: Using both visual and verbal information processing. Choose EXACTLY ONE best label. Return ONLY a compact JSON string with keys: \"labels\" (array with one element).")

        learning_style = learning_style.get("text")

        try:
            start = learning_style.find("{")
            end = learning_style.rfind("}") + 1
            json_string = learning_style[start:end]
            parsed_data = json.loads(json_string)

            style = parsed_data.get('labels')[0]

            if style == "Retrieval Practice":
                retrieval_practice_count += 1
            elif style == "Elaboration":
                elaboration_count += 1
            elif style == "Concrete Examples":
                concrete_examples_count += 1
            elif style == "Interleaving":
                interleaving_count += 1
            elif style == "Dual Coding":
                dual_coding_count += 1
        except (json.JSONDecodeError, IndexError, TypeError):
            continue
        total_count += 1

    if total_count == 0:  
        return [{"error": "No user messages found"}]

    results.append({
        "Retrieval Practice": round((retrieval_practice_count / total_count) * 100, 2),
        "Elaboration": round((elaboration_count / total_count) * 100, 2),
        "Concrete Examples": round((concrete_examples_count / total_count) * 100, 2),
        "Interleaving": round((interleaving_count / total_count) * 100, 2),
        "Dual Coding": round((dual_coding_count / total_count) * 100, 2),
        "total_user_messages": total_count
    })

    return results


# 6. taxonomy progression

import json
from datetime import datetime
from typing import List, Dict, Optional, Tuple

def calculate_taxonomy_progression_time(filepath: str) -> List[Dict]:
    """Calculate the time it takes for a student to progress from one Bloom's taxonomy level to another."""
    
    TAXONOMY_HIERARCHY = [
        "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"
    ]
    
    def get_taxonomy_level_index(level: str) -> int:
        """Get the index of a taxonomy level in the hierarchy."""
        try:
            return TAXONOMY_HIERARCHY.index(level)
        except ValueError:
            return -1
    
    def parse_timestamp(timestamp_str: str) -> datetime:
        """Parse timestamp string to datetime object."""
        try:
            # Directly use fromisoformat without any modification since the timestamp is already valid ISO 8601.
            return datetime.fromisoformat(timestamp_str)
        except ValueError:
            return None
    
    def classify_message(text: str) -> Optional[str]:
        """Classify a message using your existing classify function logic."""
        result = classify(text, system="You are a strict classifier. "
        "Classify the user's text into one Bloom's taxonomy level from this set: [Remember, Understand, Apply, Analyze, Evaluate, Create]. "
        "Choose EXACTLY ONE best label. "
        "Return ONLY a compact JSON string with keys: \"labels\" (array with one element), \"scores\" (object with a confidence for the chosen label in [0,1]), and \"reasoning\" (very short).")
        
        try:
            data = result.get("text")
            start = data.find('{')
            end = data.rfind('}') + 1
            json_string = data[start:end]
            parsed_data = json.loads(json_string)
            
            labels = parsed_data.get('labels')
            if labels and len(labels) > 0:
                return labels[0]
        except:
            pass
        return None
    
    # Load and process data
    data = load_json(filepath)
    
    # Handle both single message and list of messages
    if isinstance(data, list):
        messages = data
    elif isinstance(data, dict) and "msg_text" in data:
        messages = [data]
    else:
        return [{"error": "Invalid data format"}]
    
    # Extract user messages with timestamps and classifications
    user_messages = []
    for msg in messages:
        if msg.get("msg_sender") != "user":
            continue
            
        raw_text = msg.get("msg_text")
        timestamp_str = msg.get("msg_timestamp")
        
        if not raw_text or not timestamp_str:
            continue
            
        # Extract text content
        extracted_text = extract_text_from_msg(raw_text)
        if not extracted_text:
            continue
            
        # Parse timestamp
        timestamp = parse_timestamp(timestamp_str)
        if not timestamp:
            continue
            
        # Classify message
        taxonomy_level = classify_message(extracted_text)
        if not taxonomy_level:
            continue
            
        user_messages.append({
            "text": extracted_text,
            "timestamp": timestamp,
            "taxonomy_level": taxonomy_level,
            "level_index": get_taxonomy_level_index(taxonomy_level)
        })
    
    # Sort messages by timestamp
    user_messages.sort(key=lambda x: x["timestamp"])
    
    if len(user_messages) < 2:
        return [{"error": "Need at least 2 classified messages to calculate progression"}]
    
    # Calculate progressions
    progressions = []
    level_first_occurrence = {}  # Track first occurrence of each level
    
    for i, msg in enumerate(user_messages):
        current_level = msg["taxonomy_level"] #get text eg. "analyse"
        current_index = msg["level_index"]
        current_time = msg["timestamp"]
        
        # Record first occurrence of this level
        if current_level not in level_first_occurrence:
            level_first_occurrence[current_level] = {
                "timestamp": current_time,
                "message_index": i,
                "text": msg["text"]
            }
        
        # Look for progressions to higher levels
        for target_level, target_info in level_first_occurrence.items():
            target_index = get_taxonomy_level_index(target_level)
            
            # If current level is higher than target level, calculate progression time
            if current_index > target_index:
                time_diff = current_time - target_info["timestamp"]
                
                progression_info = { # john doe improved!
                    "from_level": target_level,
                    "to_level": current_level,
                    "from_level_index": target_index,
                    "to_level_index": current_index,
                    "level_jump": current_index - target_index, # eg. jumped 1 level up
                    "progression_time_seconds": time_diff.total_seconds(),
                    "progression_time_minutes": round(time_diff.total_seconds() / 60, 2),
                    "progression_time_hours": round(time_diff.total_seconds() / 3600, 2),
                    "progression_time_days": round(time_diff.total_seconds() / 86400, 2),
                    "from_timestamp": target_info["timestamp"].isoformat(),
                    "to_timestamp": current_time.isoformat(),
                    "from_text": target_info["text"],
                    "to_text": msg["text"],
                    "total_messages_between": i - target_info["message_index"]
                }
                
                # Only add if this progression (eg. index 1 to index 2) hasn't been recorded yet
                existing = any(
                    p["from_level"] == target_level and p["to_level"] == current_level 
                    for p in progressions
                )
                if not existing:
                    progressions.append(progression_info)
    
    # Add summary statistics
    if progressions:
        summary = {
            "total_progressions": len(progressions),
            "average_progression_time_minutes": round(
                sum(p["progression_time_minutes"] for p in progressions) / len(progressions), 2
            ),
            "fastest_progression_minutes": min(p["progression_time_minutes"] for p in progressions),
            "slowest_progression_minutes": max(p["progression_time_minutes"] for p in progressions),
            "levels_achieved": sorted(list(set(p["to_level"] for p in progressions)), 
                                    key=lambda x: get_taxonomy_level_index(x)),
            "highest_level_reached": max(progressions, key=lambda x: x["to_level_index"])["to_level"],
            "total_study_time_minutes": round(
                (user_messages[-1]["timestamp"] - user_messages[0]["timestamp"]).total_seconds() / 60, 2
            )
        }
        progressions.append({"summary": summary})
    
    return progressions

#def analyze_student_progression(filepath: str) -> None:
    """
    Analyze and print student progression through Bloom's taxonomy levels.
    """
    progressions = calculate_taxonomy_progression_time(filepath)
    
    if not progressions:
        print("No progressions found.")
        return
    
    # Check for errors
    if len(progressions) == 1 and "error" in progressions[0]:
        print(f"Error: {progressions[0]['error']}")
        return
    
    # Print individual progressions
    print("=== BLOOM'S TAXONOMY PROGRESSION ANALYSIS ===\n")
    
    for i, prog in enumerate(progressions):
        if "summary" in prog:
            print("=== SUMMARY STATISTICS ===")
            summary = prog["summary"]
            print(f"Total Progressions: {summary['total_progressions']}")
            print(f"Average Progression Time: {summary['average_progression_time_minutes']} minutes")
            print(f"Fastest Progression: {summary['fastest_progression_minutes']} minutes")
            print(f"Slowest Progression: {summary['slowest_progression_minutes']} minutes")
            print(f"Highest Level Reached: {summary['highest_level_reached']}")
            print(f"Total Study Time: {summary['total_study_time_minutes']} minutes")
            print(f"Levels Achieved: {', '.join(summary['levels_achieved'])}")
            break
        
        print(f"Progression #{i+1}:")
        print(f"  From: {prog['from_level']} → To: {prog['to_level']}")
        print(f"  Level Jump: {prog['level_jump']} levels")
        print(f"  Time Taken: {prog['progression_time_minutes']} minutes ({prog['progression_time_hours']} hours)")
        print(f"  Messages Between: {prog['total_messages_between']}")
        print(f"  From Message: \"{prog['from_text'][:100]}...\"")
        print(f"  To Message: \"{prog['to_text'][:100]}...\"")
        print()

#def get_specific_progression(filepath: str, from_level: str, to_level: str) -> Optional[Dict]:
    """
    Get progression time between two specific taxonomy levels.
    
    Args:
        filepath: Path to conversation data
        from_level: Starting taxonomy level
        to_level: Target taxonomy level
    
    Returns:
        Dictionary with progression information or None if not found
    """
    progressions = calculate_taxonomy_progression_time(filepath)
    
    for prog in progressions:
        if "summary" in prog:
            continue
        if prog.get("from_level") == from_level and prog.get("to_level") == to_level:
            return prog
    
    return None

#def get_progressions_by_jump_size(filepath: str, jump_size: int) -> List[Dict]:
    """
    Get all progressions with a specific level jump size.
    
    Args:
        filepath: Path to conversation data
        jump_size: Number of levels jumped (1, 2, 3, etc.)
    
    Returns:
        List of progressions with the specified jump size
    """
    all_progressions = calculate_taxonomy_progression_time(filepath)
    
    filtered_progressions = [
        prog for prog in all_progressions 
        if "level_jump" in prog and prog["level_jump"] == jump_size
    ]
    
    return filtered_progressions

#def get_taxonomy_summary_only(filepath: str) -> Optional[Dict]:
    """
    Get only the summary statistics from taxonomy progression analysis.
    
    Args:
        filepath: Path to conversation data
    
    Returns:
        Dictionary containing summary statistics or None if not found
    """
    results = calculate_taxonomy_progression_time(filepath)
    
    for result in results:
        if "summary" in result:
            return result["summary"]
    
    return None


