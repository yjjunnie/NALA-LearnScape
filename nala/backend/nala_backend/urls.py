"""
URL configuration for api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from app import views
from app.views import homepage_view,classify_chathistory, display_chathistory, percentage_chathistory, time_spent_per_topic, percentage_learning_style, taxonomy_progression, bloom_by_topic_classifier

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.homepage_view, name="homepage"),
    path('api/student/<string:pk>/', views.getStudent, name='get_student'),
    path('api/nodes/<string:module_id>', views.getTopicAndConcepts, name='get_nodes'),
    path('api/relationships/<string:module_id>', views.getRelationships, name='get_relationships'),
    path('api/classify-chat-history/', views.classify_chathistory, name="classify-chathistory"),
    path('api/display-chat-history/', views.display_chathistory, name="display-chathistory"),
    path('api/percentage-chat-history/', views.percentage_chathistory, name="percentage-chathistory"),
    path('api/time-spent-per-topic/', views.time_spent_per_topic, name="time-spent-per-topic"),
    path('api/percentage-learning-style/', views.percentage_learning_style, name="percentage-learningstyle"),
    path('api/module/<string:pk>/', views.getModule, name='get_module'),
    path('api/percentage-learning-style/', views.percentage_learning_style, name="percentage-learningstyle"),
    path('api/taxonomy-progression/', views.taxonomy_progression, name="taxonomy-progression"),
    path('api/bloom-by-topic-classifier/', views.bloom_by_topic_classifier, name="bloom-by-topic-classifier")
    path('api/module/<string:module_id>/topic/<string:topic_id>/notes', views.getTopic, name='get_topic'),
]
