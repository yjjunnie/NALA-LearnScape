import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nala_backend.settings')
django.setup()

from app.models import Student, Module
from app.services.blooms import update_bloom_from_chathistory

def initialize_bloom_for_all_students(module_id: int = 1):
    """
    Initialize Bloom taxonomy records for ALL students in the database
    for a specific module using the same chat history file (studentbloombytopic.json).

    Args:
        module_id (int, optional): The ID of the module to process. Defaults to 1.
    """
    
    # Configuration
    chat_filepath = 'app/services/chat_history/studentbloombytopic.json'
    
    print("=" * 60)
    print("Initializing Bloom Taxonomy Records for All Students")
    print("=" * 60)
    print(f"Chat history file: {chat_filepath}")
    print(f"Target module_id: {module_id}")
    print()
    
    # Check if file exists
    if not os.path.exists(chat_filepath):
        print(f"ERROR: File not found: {chat_filepath}")
        return
    
    # Get all students
    students = Student.objects.all()
    total_students = students.count()
    
    if total_students == 0:
        print("No students found in database.")
        return
    
    print(f"Found {total_students} student(s) in database\n")
    
    success_count = 0
    error_count = 0
    
    # Process single module for all students
    try:
        module = Module.objects.get(id=module_id)
        print(f"Processing module: {module.name} ({module.id})\n")
        
        for student in students:
            try:
                print(f"Processing: {student.name} ({student.id})")
                
                # Process chat history and update Bloom records
                update_bloom_from_chathistory(student, module_id, chat_filepath)
                
                print("  ✓ Successfully processed")
                success_count += 1
                
            except Exception as e:
                print(f"  ERROR: {str(e)}")
                error_count += 1
        
    except Module.DoesNotExist:
        print(f"ERROR: Module '{module_id}' not found")
        return
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  Total students: {total_students}")
    print(f"  Successfully processed: {success_count}")
    print(f"  Errors: {error_count}")
    print("=" * 60)
    
    if success_count > 0:
        print("\n✓ Bloom taxonomy records have been initialized!")
        print("  Students can now continue to accumulate Bloom data through:")
        print("  - New chatbot messages (processed every 10 messages or on exit)")
        print("  - Quiz completions (processed when quiz is submitted)")
    
    return success_count, error_count

if __name__ == "__main__":
    initialize_bloom_for_all_students(module_id=1)