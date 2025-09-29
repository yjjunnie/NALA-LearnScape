from .llm_service import llm
import json

def generate_quiz(topic_name, module_name, bloom_levels, num_questions=5):
    levels_str = ", ".join(bloom_levels)
    system_prompt = (
        f"You are an educational quiz generator. Generate exactly {num_questions} multiple choice questions "
        f"about '{topic_name}', which is a topic of the subject '{module_name}' with Bloom's taxonomy levels only from: [{levels_str}]. "
        "Each question should have 4 options labeled A-D, with the correct answer indicated. "
        "Return ONLY a JSON array of objects like [{\"question\": \"...\", \"options\": {\"A\": \"...\", \"B\": \"...\", \"C\": \"...\", \"D\": \"...\"}, \"answer\": \"A\", \"bloom_level\": \"Apply\"}]."
    )
    
    response = llm(text=f"Generate a {num_questions}-question quiz for {topic_name}, a topic of '{module_name}'.", system=system_prompt)
    
    try:
        quiz_json = json.loads(response["text"])
    except Exception as e:
        print("Failed to parse JSON from LLM:", e)
        quiz_json = []
    
    return quiz_json
