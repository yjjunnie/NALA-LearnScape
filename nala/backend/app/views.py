from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Module, Node, Relationship, Student, Topic, Concept, StudentNote, StudentQuizHistory
from .serializers import (
    StudentSerializer, ModuleSerializer, TopicSerializer, ConceptSerializer,
    ThreadMapTopicSerializer, ThreadMapConceptSerializer, ThreadMapRelationshipSerializer
)
from app.services.classifierjson import (
    classify_messages_from_json,
    display_messages_from_json,
    learning_style_from_json,
    percentage_from_json,
    calculate_time_spent_per_topic,
    calculate_taxonomy_progression_time,
    classify_chathistory_by_topic_and_taxonomy
)

from app.services.blooms import (
    update_bloom_from_messages,
    update_bloom_from_quiz,
    update_bloom_from_chathistory,
    get_student_bloom_summary,
    get_student_bloom_for_topic
)

from app.services.quiz_generator import generate_quiz

@api_view(['GET'])
def homepage_view(request):
    return Response({"message": "Hello, World!"})

# Chat history analytics
@api_view(["GET"])
def classify_chathistory(request):
    filepath = "app/services/chat_history/1221_short.json"
    results = classify_messages_from_json(filepath)
    return Response(results)

@api_view(["GET"])
def display_chathistory(request):
    filepath = "app/services/chat_history/newconvohistoryposted.json"
    results = display_messages_from_json(filepath)
    return Response(results)

@api_view(["GET"])
def percentage_chathistory(request):
    filepath = "app/services/chat_history/newconvohistoryposted.json"
    results = percentage_from_json(filepath)
    return Response(results)

@api_view(["GET"])
def time_spent_per_topic(request):
    filepath = "app/services/chat_history/newconvohistoryposted.json"
    results = calculate_time_spent_per_topic(filepath)
    return Response(results)

@api_view(["GET"])
def percentage_learning_style(request):
    filepath = "app/services/chat_history/newlearningstyle.json"
    results = learning_style_from_json(filepath)
    return Response(results)

@api_view(["GET"])
def taxonomy_progression(request):
    filepath = "app/services/chat_history/newlinearalgprogression.json"
    results = calculate_taxonomy_progression_time(filepath)
    return Response(results)

# OLD BLOOM CLASSIFYING VIEW:
# @api_view(["GET"])
# def bloom_by_topic_classifier(request):
#     filepath = "app/services/chat_history/studentbloombytopic.json"
#     results = classify_chathistory_by_topic_and_taxonomy(filepath)
#     return Response(results)

# Students
@api_view(["GET"])
def getStudent(request, pk):
    student = get_object_or_404(Student, pk=pk)
    return Response(StudentSerializer(student).data)

# Modules
@api_view(["GET"])
def getModule(request, pk):
    module = get_object_or_404(Module, pk=pk)
    return Response(ModuleSerializer(module).data)

# ThreadMap: topics & concepts
@api_view(["GET"])
def getTopicAndConcepts(request, module_id=None):
    topic_nodes = Topic.objects.filter(module__id=module_id) if module_id else Topic.objects.all()
    concept_nodes = Concept.objects.filter(module__id=module_id) if module_id else Concept.objects.all()
    data = ThreadMapTopicSerializer(topic_nodes, many=True).data + ThreadMapConceptSerializer(concept_nodes, many=True).data
    return Response(data)

# ThreadMap: relationships
@api_view(["GET"])
def getRelationships(request, module_id=None):
    relationships = Relationship.objects.filter(
        Q(first_node__module__id=module_id) | Q(second_node__module__id=module_id)
    ) if module_id else Relationship.objects.all()
    data = ThreadMapRelationshipSerializer(relationships, many=True).data
    return Response(data)

# Single topic
@api_view(["GET"])
def getTopic(request, module_id, topic_id):
    topic = get_object_or_404(Topic, pk=topic_id, module_id=module_id)
    return Response(TopicSerializer(topic).data)

# Topic with concepts + optional student notes
@api_view(["GET"])
def getTopicWithConcepts(request, module_id, topic_id):
    topic = get_object_or_404(Topic, pk=topic_id, module_id=module_id)
    concepts = Concept.objects.filter(related_topic=topic).order_by('id')
    topic_data = TopicSerializer(topic).data
    concepts_data = ConceptSerializer(concepts, many=True).data

    saved_notes = None
    student_id = request.query_params.get('student_id')
    if student_id:
        try:
            note = StudentNote.objects.get(student_id=student_id, topic=topic)
            saved_notes = note.content
        except StudentNote.DoesNotExist:
            saved_notes = None

    response_data = {
        'id': topic_data['id'],
        'name': topic_data['name'],
        'description': topic_data.get('summary', ''),
        'concepts': [{'id': c['id'], 'name': c['name'], 'description': c['summary']} for c in concepts_data],
        'notes': saved_notes
    }
    return Response(response_data)

# Student notes CRUD
@api_view(["GET", "POST"])
def student_topic_notes(request, student_id, topic_id):
    student = get_object_or_404(Student, pk=student_id)
    topic = get_object_or_404(Topic, pk=topic_id)

    if request.method == "GET":
        note_obj = StudentNote.objects.filter(student=student, topic=topic).first()
        notes = note_obj.content if note_obj else ""
        topic_data = TopicSerializer(topic).data
        topic_data["notes"] = notes
        return Response(topic_data)

    if request.method == "POST":
        content = request.data.get("content", "")
        note_obj, _ = StudentNote.objects.get_or_create(student=student, topic=topic)
        note_obj.content = content
        note_obj.save()
        return Response({"status": "saved", "notes": note_obj.content})

@api_view(['GET'])
def get_weekly_quiz(request, module_id):
    """
    Fetch weekly quiz questions from the database for a specific module.
    Weekly quizzes are pre-loaded, so this only retrieves existing entries.
    """
    try:
        student_id = request.GET.get('student_id')
        topic_ids_param = request.GET.get('topics')
        
        if not student_id:
            return Response(
                {'error': 'student_id is required as query parameter'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        student = Student.objects.get(id=str(student_id))
        module = Module.objects.get(id=str(module_id))
        
        # Parse topic IDs (strings only)
        if not topic_ids_param:
            return Response(
                {'error': 'topics parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        topic_ids = [tid.strip() for tid in topic_ids_param.split(',') if tid.strip()]
        topic_ids_set = set(topic_ids)
        
        topics = Topic.objects.filter(module=module, id__in=topic_ids)
        
        if not topics.exists():
            return Response(
                {'error': 'No topics found for the provided IDs'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Find existing weekly quiz by matching exact topic_ids in quiz_data
        existing_quiz = None
        candidate_quizzes = StudentQuizHistory.objects.filter(
            student=student,
            module=module,
            quiz_type='weekly'
        )
        
        for quiz in candidate_quizzes:
            stored_topic_ids = set(quiz.get_topic_ids())
            if stored_topic_ids == topic_ids_set:
                existing_quiz = quiz
                break
        
        if not existing_quiz:
            return Response(
                {'error': 'Weekly quiz not found for selected topics. Please contact your instructor.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        questions = existing_quiz.get_questions()

        return Response({
            'quiz_history_id': str(existing_quiz.id),
            'questions': questions,
            'student_answers': existing_quiz.student_answers or {},
            'completed': existing_quiz.completed,
            'score': existing_quiz.score,
            'can_retry': existing_quiz.get_effective_quiz_type() == 'weekly',
        })
        
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def generate_custom_quiz(request, module_id):
    """
    Generate a custom quiz using LLM based on user's preferences.
    """
    try:
        try:
            num_questions = int(request.data.get('num_questions', 10))
        except (TypeError, ValueError):
            return Response({'error': 'num_questions must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        if num_questions <= 0:
            return Response({'error': 'num_questions must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)

        bloom_levels = request.data.get('bloom_levels', ['Remember', 'Understand'])
        if isinstance(bloom_levels, str):
            bloom_levels = [level.strip() for level in bloom_levels.split(',') if level.strip()]

        student_id = request.data.get('student_id')
        topic_ids = request.data.get('topic_ids', [])
        if isinstance(topic_ids, str):
            topic_ids = [tid.strip() for tid in topic_ids.split(',') if tid.strip()]
        
        if not student_id:
            return Response({'error': 'student_id is required in request body'}, status=status.HTTP_400_BAD_REQUEST)
        
        student = Student.objects.get(id=str(student_id))
        module = Module.objects.get(id=str(module_id))
        
        if topic_ids:
            topics = Topic.objects.filter(module=module, id__in=topic_ids)
        else:
            topics = Topic.objects.filter(module=module)
        
        if not topics.exists():
            return Response({'error': 'No topics found for this module'}, status=status.HTTP_404_NOT_FOUND)
        
        topics_list = list(topics)
        questions_per_topic = max(1, num_questions // len(topics_list))
        all_questions = []
        
        for topic in topics_list:
            topic_questions = generate_quiz(
                topic_name=topic.name,
                module_name=module.name,
                bloom_levels=bloom_levels,
                num_questions=questions_per_topic
            )

            if not topic_questions:
                continue

            for q in topic_questions:
                q['topic_id'] = str(topic.id)  # store as string
            all_questions.extend(topic_questions)

        if not all_questions:
            return Response(
                {'error': 'Unable to generate quiz questions at this time. Please try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        all_questions = all_questions[:num_questions]
        
        topic_ids_to_store = [str(t.id) for t in topics_list]
        
        quiz_history = StudentQuizHistory.objects.create(
            student=student,
            module=module,
            quiz_data={
                'questions': all_questions,
                'quiz_type': 'custom',
                'bloom_levels': bloom_levels,
                'num_questions': num_questions,
                'topic_ids': topic_ids_to_store
            },
            student_answers={},
            completed=False,
            score=None,
            quiz_type='custom'
        )
        
        quiz_history.topics_covered.set(topics)
        
        return Response({
            'quiz_history_id': str(quiz_history.id),
            'questions': all_questions,
            'student_answers': {},
            'completed': False,
        }, status=status.HTTP_201_CREATED)
        
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
def save_quiz_answer(request, quiz_history_id):
    """
    Save a single answer as the student progresses through the quiz.
    """
    try:
        question_index = str(request.data.get('question_index'))
        answer = request.data.get('answer')
        student_id = request.data.get('student_id')
        
        if not student_id:
            return Response({'error': 'student_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        quiz_history = StudentQuizHistory.objects.get(id=str(quiz_history_id))
        
        if str(quiz_history.student_id) != str(student_id):
            return Response({'error': 'Unauthorized: Quiz does not belong to this student'}, status=status.HTTP_403_FORBIDDEN)
        
        if not quiz_history.student_answers:
            quiz_history.student_answers = {}
        
        quiz_history.student_answers[str(question_index)] = answer
        quiz_history.save()
        
        return Response({'status': 'success', 'message': 'Answer saved'})
        
    except StudentQuizHistory.DoesNotExist:
        return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def submit_quiz(request, quiz_history_id):
    """
    Submit the complete quiz, calculate score, and update Bloom records.
    For weekly quizzes, this updates the same entry (allowing retries).
    """
    try:
        answers = request.data.get('answers', {})
        student_id = request.data.get('student_id')
        
        if not student_id:
            return Response({'error': 'student_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        quiz_history = StudentQuizHistory.objects.get(id=str(quiz_history_id))
        
        if str(quiz_history.student_id) != str(student_id):
            return Response({'error': 'Unauthorized: Quiz does not belong to this student'}, status=status.HTTP_403_FORBIDDEN)
        
        quiz_history.student_answers = {str(k): v for k, v in answers.items()}
        
        questions = quiz_history.get_questions()
        correct_count = 0

        for idx, question in enumerate(questions):
            student_answer = quiz_history.student_answers.get(str(idx))
            correct_answer = question.get('answer') or question.get('correct_answer')
            if student_answer == correct_answer:
                correct_count += 1
        
        score = (correct_count / len(questions)) * 100 if questions else 0
        
        quiz_history.score = score
        quiz_history.completed = True
        quiz_history.save()
        
        update_bloom_from_quiz(quiz_history.student, quiz_history)
        
        quiz_type = quiz_history.get_effective_quiz_type()
        
        return Response({
            'status': 'success',
            'score': score,
            'correct_count': correct_count,
            'total_questions': len(questions),
            'quiz_type': quiz_type,
            'can_retry': quiz_type == 'weekly',
        })
        
    except StudentQuizHistory.DoesNotExist:
        return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_quiz_history(request, student_id):
    """
    Get all quiz history for a student.
    """
    try:
        student = Student.objects.get(id=student_id)
        quiz_histories = StudentQuizHistory.objects.filter(
            student=student,
            completed=True
        ).order_by('-created_at')

        history_data = []
        for quiz in quiz_histories:
            questions = quiz.get_questions()
            history_data.append({
                'id': quiz.id,
                'module_name': quiz.module.name if quiz.module else 'N/A',
                'score': quiz.score,
                'num_questions': len(questions),
                'quiz_type': quiz.get_effective_quiz_type(),
                'created_at': quiz.created_at.isoformat(),
            })
        
        return Response({'quiz_history': history_data})
        
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ==================== BLOOM TAXONOMY TRACKING ====================

@api_view(['POST'])
def process_pending_messages(request):
    """
    Process pending messages for Bloom classification.
    Called every 10 messages or when user exits chatbot.
    
    Expected payload:
    {
        "student_id": "student_123",
        "module_id": "module_456",
        "message_ids": [101, 102, 103, ...]
    }
    """
    try:
        data = request.data
        student_id = data.get('student_id')
        module_id = data.get('module_id')
        message_ids = data.get('message_ids', [])
        
        if not student_id or not module_id:
            return Response(
                {'error': 'student_id and module_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not message_ids:
            return Response(
                {'message': 'No messages to process'},
                status=status.HTTP_200_OK
            )
        
        # Get student
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Process messages using blooms.py function
        update_bloom_from_messages(student, module_id, message_ids)
        
        # Return updated summary
        bloom_summary = get_student_bloom_summary(student, module_id)
        
        return Response({
            'message': 'Messages processed successfully',
            'processed_count': len(message_ids),
            'bloom_summary': bloom_summary
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def process_quiz_completion(request):
    """
    Process completed quiz for Bloom classification.
    Called when a quiz is submitted (handled automatically in submit_quiz now).
    
    Expected payload:
    {
        "student_id": "student_123",
        "quiz_history_id": 789
    }
    """
    try:
        data = request.data
        student_id = data.get('student_id')
        quiz_history_id = data.get('quiz_history_id')
        
        if not student_id or not quiz_history_id:
            return Response(
                {'error': 'student_id and quiz_history_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get student and quiz history
        try:
            student = Student.objects.get(id=student_id)
            quiz_history = StudentQuizHistory.objects.get(id=quiz_history_id)
        except (Student.DoesNotExist, StudentQuizHistory.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify the quiz belongs to this student
        if quiz_history.student_id != student_id:
            return Response(
                {'error': 'Quiz does not belong to this student'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Process quiz using blooms.py function
        update_bloom_from_quiz(student, quiz_history)
        
        # Return updated summary
        bloom_summary = get_student_bloom_summary(
            student, 
            str(quiz_history.module_id)
        )
        
        return Response({
            'message': 'Quiz processed successfully',
            'bloom_summary': bloom_summary
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def initialize_bloom_from_history(request):
    """
    Initialize Bloom records from historical chat data.
    Used for initial setup with existing chat history JSON files.
    
    Expected payload:
    {
        "student_id": "student_123",
        "module_id": "module_456",
        "chat_filepath": "/path/to/chat_history.json"
    }
    """
    try:
        data = request.data
        student_id = data.get('student_id')
        module_id = data.get('module_id')
        chat_filepath = data.get('chat_filepath')
        
        if not student_id or not module_id or not chat_filepath:
            return Response(
                {'error': 'student_id, module_id, and chat_filepath are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get student
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Process chat history using blooms.py function
        update_bloom_from_chathistory(student, module_id, chat_filepath)
        
        # Return updated summary
        bloom_summary = get_student_bloom_summary(student, module_id)
        
        return Response({
            'message': 'Chat history processed successfully',
            'bloom_summary': bloom_summary
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_bloom_summary(request):
    """
    Get Bloom summary for a student in a module.
    
    Query params:
        student_id: Student ID
        module_id: Module ID
        topic_id: Optional - get summary for specific topic only
    """
    try:
        student_id = request.GET.get('student_id')
        module_id = request.GET.get('module_id')
        topic_id = request.GET.get('topic_id')
        
        if not student_id or not module_id:
            return Response(
                {'error': 'student_id and module_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get student
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get summary using blooms.py functions
        if topic_id:
            bloom_data = get_student_bloom_for_topic(student, module_id, topic_id)
        else:
            bloom_data = get_student_bloom_summary(student, module_id)
        
        return Response({
            'student_id': student_id,
            'module_id': module_id,
            'topic_id': topic_id,
            'bloom_summary': bloom_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )