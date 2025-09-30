# Model gets Bloom's level for specific student and topic 

from app.models import StudentBloomLevel

BLOOM_ORDER = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]

def get_highest_blooms_level(blooms_dict):
    """Return the highest Bloom's level that has a non-zero count."""
    if not blooms_dict:
        return None
    for level in reversed(BLOOM_ORDER):
        if blooms_dict.get(level, 0) > 0:
            return level
    return None

def get_blooms_level(student_id, topic_id):
    """Fetch the highest Bloom's level for a given student + topic."""
    try:
        entry = StudentBloomLevel.objects.get(student_id=student_id, node_id=topic_id)
        return get_highest_blooms_level(entry.blooms_level)
    except StudentBloomLevel.DoesNotExist:
        return None


# blooms_dict looks like this:
"""eg. {
    "1": {  # topic_id
        "Remember": 5,
        "Understand": 3,
        "Apply": 2,
        "Analyze": 0,
        "Evaluate": 0,
        "Create": 0
    },
    "2": {  # another topic_id
        "Remember": 2,
        "Understand": 4,
        "Apply": 1,
        "Analyze": 1,
        "Evaluate": 0,
        "Create": 0
    }
}
"""                                                                   