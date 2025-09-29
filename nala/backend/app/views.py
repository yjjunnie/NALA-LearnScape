from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Module, Node, Relationship, Student, Topic, Concept, StudentNote
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

@api_view(["GET"])
def bloom_by_topic_classifier(request):
    filepath = "app/services/chat_history/studentbloombytopic.json"
    results = classify_chathistory_by_topic_and_taxonomy(filepath)
    return Response(results)

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
