from django.shortcuts import redirect, get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
#import requests
#import os
from app.services.classifierjson import classify_messages_from_json

@api_view(['GET'])
def homepage_view():
    return Response()

@api_view(["GET"])
def classify_chathistory():
    filepath = "app/services/chat_history/1221_get.json"  # Adjust path if needed
    results = classify_messages_from_json(filepath)
    return Response(results)

    