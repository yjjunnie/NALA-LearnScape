from django.shortcuts import redirect, get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
#import requests
#import os
from app.services.classifierjson import classify_messages_from_json, display_messages_from_json, percentage_from_json

@api_view(['GET'])
def homepage_view(request):
    return Response({"message": "Hello, World!"})

@api_view(["GET"])
def classify_chathistory(request):
    filepath = "app/services/chat_history/1221_get.json"  # Adjust path if needed
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
