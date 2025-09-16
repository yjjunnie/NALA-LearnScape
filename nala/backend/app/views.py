from django.shortcuts import redirect, get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view

@api_view(['GET'])
def homepage_view():
    return Response()
    