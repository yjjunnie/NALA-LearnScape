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

    # Quiz endpoints
    path('api/module/<str:module_id>/quiz/weekly/', views.get_weekly_quiz, name='get_weekly_quiz'),
    path('api/module/<str:module_id>/quiz/generate/', views.generate_custom_quiz, name='generate_custom_quiz'),
    path('api/quiz/<int:quiz_history_id>/answer/', views.save_quiz_answer, name='save_quiz_answer'),
    path('api/quiz/<int:quiz_history_id>/submit/', views.submit_quiz, name='submit_quiz'),
    path('api/student/<str:student_id>/quiz-history/', views.get_quiz_history, name='get_quiz_history'),

    # Bloom's Taxonomy Levels
    path('api/bloom/process-messages/', views.process_pending_messages, name='process_pending_messages'),
    path('api/bloom/process-quiz/', views.process_quiz_completion, name='process_quiz_completion'),
    path('api/bloom/initialize/', views.initialize_bloom_from_history, name='initialize_bloom_from_history'),
    path('api/bloom/restore/', views.restore_bloom_summary, name='restore_bloom_summary'),
    path('api/bloom/summary/', views.get_bloom_summary, name='get_bloom_summary'),
    path('api/bloom/progression/', views.get_bloom_progression, name='get_bloom_progression'),

    # Learning preferences
    path('api/learning-preferences/update/', views.update_learning_preferences, name='update_learning_preferences'),
]