import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nala_backend.settings')
django.setup()

from app.models import Student, Topic, StudentNote, Concept

def generate_default_notes(topic):
    """
    Generate default notes for a topic using its summary and all related concepts.
    """
    # Start with the topic's summary
    note = topic.summary or ""
    
    # Append concepts under this topic
    concepts = Concept.objects.filter(related_topic=topic).order_by('id')
    for concept in concepts:
        note += f"\n\n## {concept.name}\n{concept.summary.strip() if concept.summary else ''}"
    
    return note

def populate_student_notes():
    students = Student.objects.all()
    print(f"Found {students.count()} students. Populating notes...")

    for student in students:
        print(f"Processing student: {student.name} (ID: {student.id})")
        
        # Get all topics from modules the student is enrolled in
        enrolled_modules = student.enrolled_modules.all()
        topics = Topic.objects.filter(module__in=enrolled_modules)
        
        for topic in topics:
            # Create StudentNote if it doesn't already exist
            note_obj, created = StudentNote.objects.get_or_create(
                student=student,
                topic=topic,
                defaults={"content": generate_default_notes(topic)}
            )
            if created:
                print(f"  Created note for topic: {topic.name}")
            else:
                print(f"  Note already exists for topic: {topic.name}")

    print("All student notes populated!")

if __name__ == "__main__":
    populate_student_notes()
