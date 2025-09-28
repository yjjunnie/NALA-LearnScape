import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nala_backend.settings')
django.setup()

from app.models import Student
from app.services.classifierjson import learning_style_from_json

# Run function
results = learning_style_from_json("app/services/chat_history/newlearningstyle.json")

# Update students
if results and not any("error" in str(result) for result in results):
    breakdown = results[0] if isinstance(results, list) else results
    
    for student in Student.objects.all():
        student.learningStyleBreakdown = breakdown
        student.save()
        print(f"Updated student: {student.name}")
        
    print("All students updated!")
else:
    print("Error in results:", results)