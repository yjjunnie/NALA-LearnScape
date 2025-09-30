from .llm_service import llm
import json
import logging
from typing import Iterable, List, Dict, Any


logger = logging.getLogger(__name__)


def _coerce_bloom_levels(levels: Iterable[str]) -> List[str]:
    """Ensure bloom levels are strings and filter out empty values."""
    coerced = []
    for level in levels or []:
        if not level:
            continue
        coerced.append(str(level).strip())
    return coerced or ["Remember"]


def _extract_json_payload(raw_text: str) -> List[Dict[str, Any]]:
    """Attempt to extract and parse a JSON array from LLM output."""
    if not raw_text:
        return []

    # Some models wrap JSON in extra commentary – try to isolate the array.
    start = raw_text.find("[")
    end = raw_text.rfind("]")
    candidate = raw_text if start == -1 or end == -1 else raw_text[start : end + 1]

    try:
        data = json.loads(candidate)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    logger.warning("Unable to parse quiz payload from LLM response: %s", raw_text)
    return []


def _normalise_question_payload(raw_questions: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter malformed questions and ensure consistent option keys."""
    normalised_questions: List[Dict[str, Any]] = []

    for question in raw_questions or []:
        if not isinstance(question, dict):
            continue

        text = str(question.get("question", "")).strip()
        options = question.get("options") or {}
        answer = str(question.get("answer", "")).strip().upper()
        bloom_level = str(question.get("bloom_level", "")).strip()

        if not text or not options or answer not in {"A", "B", "C", "D"}:
            continue

        # Ensure options use the canonical A-D keys with string values.
        normalised_options = {}
        for key in ["A", "B", "C", "D"]:
            value = options.get(key)
            if value is None:
                break
            normalised_options[key] = str(value)
        else:
            normalised_questions.append(
                {
                    "question": text,
                    "options": normalised_options,
                    "answer": answer,
                    "bloom_level": bloom_level or None,
                }
            )

    return normalised_questions


def generate_quiz(topic_name, module_name, bloom_levels, num_questions=10):
    bloom_levels = _coerce_bloom_levels(bloom_levels)
    levels_str = ", ".join(bloom_levels)
    system_prompt = (
        f"You are an educational quiz generator. Generate exactly {num_questions} multiple choice questions "
        f"about '{topic_name}', which is a topic of the subject '{module_name}' with Bloom's taxonomy levels only from: [{levels_str}]. "
        "Each question should have 4 options labeled A-D, with the correct answer indicated. "
        "Return ONLY a JSON array of objects like [{\"question\": \"...\", \"options\": {\"A\": \"...\", \"B\": \"...\", \"C\": \"...\", \"D\": \"...\"}, \"answer\": \"A\", \"bloom_level\": \"Apply\"}]."
    )

    response = llm(
        text=f"Generate a {num_questions}-question quiz for {topic_name}, a topic of '{module_name}'.",
        system=system_prompt,
    )

    raw_text = ""
    if isinstance(response, dict):
        raw_text = response.get("text") or response.get("response", "")
    elif isinstance(response, str):
        raw_text = response

    questions = _extract_json_payload(raw_text)
    questions = _normalise_question_payload(questions)

    if not questions:
        logger.error("Quiz generation failed for topic '%s' (module '%s').", topic_name, module_name)

    return questions[: int(num_questions) if str(num_questions).isdigit() else len(questions)]
