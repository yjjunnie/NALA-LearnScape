from django.db.models import Q
from sys import api_version
from django.shortcuts import redirect, get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import *
from .serializers import *
#import requests
#import os
from app.services.classifierjson import classify_messages_from_json, display_messages_from_json, learning_style_from_json, percentage_from_json, calculate_time_spent_per_topic, learning_style_from_json, calculate_taxonomy_progression_time, classify_chathistory_by_topic_and_taxonomy

@api_view(['GET'])
def homepage_view(request):
    return Response({"message": "Hello, World!"})

@api_view(["GET"])
def classify_chathistory(request):
    filepath = "app/services/chat_history/1221_short.json"  # Adjust path if needed
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
def getStudent(request, pk):
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    serializedData = StudentSerializer(student).data
    return Response(serializedData)

@api_view(["GET"]) 
def getModule(request, pk):
    try:
        module = Module.objects.get(pk=pk)
    except Module.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    serializedData = ModuleSerializer(module).data
    return Response(serializedData)

@api_view(["GET"])
def getTopicAndConcepts(request, module_id=None):
    if module_id:
        topic_nodes = Topic.objects.filter(module__id=module_id)
        concept_nodes = Concept.objects.filter(module__id=module_id)
    else:
        topic_nodes = Topic.objects.all()
        concept_nodes = Concept.objects.all()
    serializedData = ThreadMapTopicSerializer(topic_nodes, many=True).data
    serializedData += ThreadMapConceptSerializer(concept_nodes, many=True).data
    return Response(serializedData)

@api_view(["GET"])
def getRelationships(request, module_id=None):
    if module_id:
        relationships = Relationship.objects.filter(
            Q(first_node__module__id=module_id) | Q(second_node__module__id=module_id) # Filter relationships where either node belongs to the module
        )
    else:
        relationships = Relationship.objects.all()
    serializedData = ThreadMapRelationshipSerializer(relationships, many=True).data
    return Response(serializedData)

@api_view(["GET"])
def getTopic(request, module_id, topic_id):
    try:
        topic = Topic.objects.get(pk=topic_id, module_id=module_id)
    except Topic.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    serializedData = TopicSerializer(topic).data
    return Response(serializedData)

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