import csv
import json
from typing import Dict, List, Optional
from django.db import transaction
from app.models import Module, Student, Topic, StudentBloomRecord, Message, StudentQuizHistory
from app.services.classifier import classify


# -------------------- Helpers --------------------

def load_json(filepath: str):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_text_from_msg(raw_text: str) -> Optional[str]:
    """Extract text from msg_text field which contains JSON array format."""
    if not raw_text:
        return None
    try:
        # Handle JSON array format: "[{\"type\": \"text\", \"text\": \"actual text\"}]"
        if isinstance(raw_text, str) and '[{' in raw_text:
            data = json.loads(raw_text)
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                return data[0].get('text', '')
        # Handle simple JSON object format
        elif isinstance(raw_text, str) and raw_text.strip().startswith('{'):
            data = json.loads(raw_text)
            return data.get('text', raw_text)
        # Plain text
        return raw_text
    except (json.JSONDecodeError, KeyError, IndexError, TypeError):
        return raw_text


def load_topics_from_db(module_id: str) -> List[Dict]:
    topics = Topic.objects.filter(module_id=module_id).values('id', 'name', 'summary')
    return [
        {
            'id': str(topic['id']),
            'name': topic['name'],
            'description': topic['summary']
        }
        for topic in topics
    ]


def classify_messages_by_topic_and_taxonomy(
    messages: List[Dict],
    topics: List[Dict]
) -> Dict[str, Dict[str, int]]:
    # Initialize result
    result = {t['id']: {lvl: 0 for lvl in ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]} 
              for t in topics}
    if not topics:
        print("WARNING: No topics provided for classification")
        return result

    topic_list_str = ", ".join([f"topic_id_{t['id']}: {t['name']}" for t in topics])
    
    print(f"\n=== Starting Classification ===")
    print(f"Total messages to process: {len(messages)}")
    print(f"Topics available: {[t['name'] for t in topics]}")
    print(f"Topic IDs: {[t['id'] for t in topics]}\n")

    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    for idx, msg in enumerate(messages):
        # Only process user messages
        sender = msg.get("msg_sender", "")
        if sender != "user":
            skipped_count += 1
            continue
            
        # Extract text from the JSON array format
        raw_text = msg.get("msg_text", "")
        text = extract_text_from_msg(raw_text)
        
        if not text or len(text.strip()) == 0:
            print(f"Message {idx}: No text content (raw: {raw_text[:100]}...)")
            skipped_count += 1
            continue

        print(f"\nMessage {idx + 1}:")
        print(f"  Text: {text[:100]}...")

        try:
            classification = classify(
                text,
                system=f"You are a strict classifier. "
                       f"Classify the student's message into ONE topic from this list: [{topic_list_str}] "
                       f"and ONE Bloom's Taxonomy level from [Remember, Understand, Apply, Analyze, Evaluate, Create]. "
                       f"Return ONLY a JSON object with 'topic_id' (as a number) and 'bloom_level' (exact spelling). "
                       f"Example: {{\"topic_id\": 1, \"bloom_level\": \"Apply\"}}"
            )

            classification_text = classification.get("text", "")
            if not classification_text:
                print(f"  No classification returned")
                error_count += 1
                continue
                
            # Find JSON in response
            start = classification_text.find('{')
            end = classification_text.rfind('}') + 1
            if start == -1 or end == 0:
                print(f"  No JSON found in: {classification_text[:150]}")
                error_count += 1
                continue
                
            json_str = classification_text[start:end]
            parsed = json.loads(json_str)
            
            tid = str(parsed.get('topic_id', ''))
            level = parsed.get('bloom_level', '')
            
            # Validate the classification
            if not tid or not level:
                print(f"  Missing topic_id or bloom_level in: {parsed}")
                error_count += 1
                continue
                
            if tid not in result:
                print(f"  Invalid topic_id: {tid} (valid: {list(result.keys())})")
                error_count += 1
                continue
                
            if level not in result[tid]:
                print(f"  Invalid bloom_level: {level}")
                error_count += 1
                continue
            
            # Success!
            result[tid][level] += 1
            processed_count += 1
            print(f"  Topic {tid}, Level: {level}")
                
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            print(f"  Error: {type(e).__name__}: {e}")
            error_count += 1
            continue

    print(f"\n{'='*60}")
    print(f"Classification Summary:")
    print(f"  Processed successfully: {processed_count}")
    print(f"  Skipped (non-user): {skipped_count}")
    print(f"  Errors: {error_count}")
    print(f"{'='*60}")
    
    # Print results per topic
    for topic_id, counts in result.items():
        topic_name = next((t['name'] for t in topics if t['id'] == topic_id), f"Topic {topic_id}")
        total = sum(counts.values())
        if total > 0:
            print(f"\n{topic_name} (ID: {topic_id}): {total} messages")
            for level, count in counts.items():
                if count > 0:
                    print(f"  {level}: {count}")
    
    return result


def update_bloom_record(record: StudentBloomRecord, classification: Dict[str, Dict[str, int]]):
    if not record.bloom_summary:
        record.bloom_summary = {}

    for topic_id, counts in classification.items():
        if topic_id not in record.bloom_summary:
            record.bloom_summary[topic_id] = {lvl: 0 for lvl in ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]}
        for lvl, count in counts.items():
            if count > 0:
                record.bloom_summary[topic_id][lvl] += count


# -------------------- Main Update Functions --------------------

@transaction.atomic
def update_bloom_from_chathistory(
    student: Student, 
    module_id: str, 
    chat_filepath: str
):
    """Bulk update from existing chat history JSON file."""
    print(f"\n{'='*60}")
    print(f"Processing Chat History")
    print(f"{'='*60}")
    print(f"Student: {student.name} (ID: {student.id})")
    print(f"Module ID: {module_id}")
    print(f"File: {chat_filepath}")
    print(f"{'='*60}\n")
    
    # Get module and record
    module = Module.objects.get(id=module_id)
    record, created = StudentBloomRecord.objects.get_or_create(student=student, module=module)
    
    if created:
        print("✓ Created new StudentBloomRecord")
    else:
        print("✓ Found existing StudentBloomRecord")
        if record.bloom_summary:
            print(f"  Existing data: {sum(sum(v.values()) for v in record.bloom_summary.values())} total counts")
    
    # Load messages
    messages = load_json(chat_filepath)
    if isinstance(messages, dict):
        if 'messages' in messages:
            messages = messages['messages']
        else:
            messages = [messages]
    
    print(f"\n✓ Loaded {len(messages)} messages from file")
    
    # Load topics
    topics = load_topics_from_db(module_id)
    print(f"✓ Loaded {len(topics)} topics from database:")
    for t in topics:
        print(f"  - Topic {t['id']}: {t['name']}")
    
    if not topics:
        print("\n ERROR: No topics found in database for this module!")
        return
    
    # Classify messages
    classification = classify_messages_by_topic_and_taxonomy(messages, topics)
    
    # Update record
    print(f"\n{'='*60}")
    print("Updating Bloom Record...")
    print(f"{'='*60}")
    
    update_bloom_record(record, classification)
    record.save()
    
    print("✓ Saved bloom record to database")
    print(f"\nFinal bloom_summary:")
    print(json.dumps(record.bloom_summary, indent=2))


@transaction.atomic
def update_bloom_from_messages(
    student: Student,
    module_id: str,
    message_ids: List[int]
):
    """Update Bloom levels from new messages (every 10 messages or on exit)."""
    module = Module.objects.get(id=module_id)
    record, _ = StudentBloomRecord.objects.get_or_create(student=student, module=module)
    topics = load_topics_from_db(module_id)

    messages = Message.objects.filter(
        msg_id__in=message_ids,
        student=student,
        module=module,
        msg_sender='user'
    ).values('msg_id', 'msg_text', 'msg_sender')

    message_list = list(messages)
    if not message_list:
        return

    classification = classify_messages_by_topic_and_taxonomy(message_list, topics)
    update_bloom_record(record, classification)
    record.save()


@transaction.atomic
def update_bloom_from_quiz(student, quiz_history):
    """
    Update student's Bloom taxonomy levels based on quiz performance.
    Only updates for CORRECT answers.

    The Bloom record is retrieved directly from the database using the
    student's ID to ensure we always update the same persisted entry.
    """

    # Accept either a Student instance or a raw ID to make the helper flexible.
    student_id = getattr(student, "id", student)
    if not student_id:
        return None

    module = quiz_history.module
    if not module:
        return None

    # Lock the Bloom record row so concurrent quiz submissions do not create
    # duplicate records or overwrite each other's updates.
    bloom_record = (
        StudentBloomRecord.objects.select_for_update()
        .filter(student_id=str(student_id), module=module)
        .first()
    )

    if not bloom_record:
        bloom_record = StudentBloomRecord(
            student_id=str(student_id),
            module=module,
            bloom_summary={}
        )

    bloom_summary = bloom_record.bloom_summary or {}

    questions = quiz_history.get_questions()
    student_answers = quiz_history.student_answers or {}

    for idx, question in enumerate(questions):
        student_answer = student_answers.get(str(idx))
        correct_answer = question.get('answer') or question.get('correct_answer')

        if student_answer != correct_answer:
            continue

        topic_id = str(question.get('topic_id'))
        bloom_level = question.get('bloom_level')

        if not topic_id or not bloom_level:
            continue

        # Initialize topic if it doesn't exist (use same structure as chat history)
        if topic_id not in bloom_summary:
            bloom_summary[topic_id] = {
                'Remember': 0,
                'Understand': 0,
                'Apply': 0,
                'Analyze': 0,
                'Evaluate': 0,
                'Create': 0
            }

        # Increment the bloom level count
        if bloom_level in bloom_summary[topic_id]:
            bloom_summary[topic_id][bloom_level] += 1

    bloom_record.bloom_summary = bloom_summary
    bloom_record.save()
    return bloom_record


def get_student_bloom_summary(student, module_id):
    """
    Get bloom summary for a student in a module.
    Returns aggregated data across all topics.
    """
    try:
        bloom_record = StudentBloomRecord.objects.get(
            student=student,
            module_id=str(module_id)
        )
        return bloom_record.bloom_summary
    except StudentBloomRecord.DoesNotExist:
        return {}


def get_student_bloom_for_topic(student, module_id, topic_id):
    """
    Get bloom summary for a specific topic.
    """
    try:
        bloom_record = StudentBloomRecord.objects.get(
            student=student,
            module_id=str(module_id) 
        )
        return bloom_record.bloom_summary.get(str(topic_id), {}) 
    except StudentBloomRecord.DoesNotExist:
        return {}