from django.shortcuts import redirect, get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import *
from .serializers import *
#import requests
#import os
from app.services.classifierjson import classify_messages_from_json, display_messages_from_json, learning_style_from_json, percentage_from_json, calculate_time_spent_per_topic, learning_style_from_json

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
def getNodes(request):
    nodes = Node.objects.all()
    serializedData = NodeSerializer(nodes, many=True).data
    return Response(serializedData)

@api_view(["GET"])
def getRelationships(request):
    relationships = Relationship.objects.all()
    serializedData = RelationshipSerializer(relationships, many=True).data
    return Response(serializedData)

@api_view(["GET"])
def percentage_learning_style(request):
    filepath = "app/services/chat_history/newlearningstyle.json"
    results = learning_style_from_json(filepath)
    return Response(results)