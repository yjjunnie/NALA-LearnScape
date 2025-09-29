import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nala_backend.settings')
django.setup()

from app.models import Student
from app.services.classifierjson import classify_chathistory_by_topic_and_taxonomy

# Run function
results = classify_chathistory_by_topic_and_taxonomy("app/services/chat_history/studentbloombytopic.json")

# Update students
if results and not any("error" in str(result) for result in results):
    breakdown = results[0] if isinstance(results, list) else results
    
    for student in Student.objects.all():
        student.learningStyleBreakdown = breakdown # NEED TO CHANGE DATABASE FOR STUDENTS TO HAVE A NEW COLUMN
        student.save()
        print(f"Updated student: {student.name}")
        
    print("All students updated!")
else:
    print("Error in results:", results)