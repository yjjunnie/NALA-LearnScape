from django.contrib import admin
from django.urls import path
from app import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.homepage_view, name="homepage"),

    # Students
    path('api/student/<str:pk>/', views.getStudent, name='get_student'),
    path('api/student/<str:student_id>/topic/<str:topic_id>/notes/', views.student_topic_notes, name='student_topic_notes'),

    # Modules & topics 
    path('api/module/<str:pk>/', views.getModule, name='get_module'),
    path('api/nodes/<str:module_id>/', views.getTopicAndConcepts, name='get_nodes'),
    path('api/relationships/<str:module_id>/', views.getRelationships, name='get_relationships'),
    path('api/module/<str:module_id>/topic/<str:topic_id>/', views.getTopic, name='get_topic'),
    path('api/module/<str:module_id>/topic/<str:topic_id>/full/', views.getTopicWithConcepts, name='get_topic_with_concepts'),

    # Chat analytics
    path('api/classify-chat-history/', views.classify_chathistory, name="classify-chathistory"),
    path('api/display-chat-history/', views.display_chathistory, name="display-chathistory"),
    path('api/percentage-chat-history/', views.percentage_chathistory, name="percentage-chathistory"),
    path('api/time-spent-per-topic/', views.time_spent_per_topic, name="time-spent-per-topic"),
    path('api/percentage-learning-style/', views.percentage_learning_style, name="percentage-learningstyle"),
    path('api/taxonomy-progression/', views.taxonomy_progression, name="taxonomy-progression"),
    path('api/bloom-by-topic-classifier/', views.bloom_by_topic_classifier, name="bloom-by-topic-classifier"),
]
