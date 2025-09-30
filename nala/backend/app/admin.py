from django.contrib import admin
from .models import (
    Module, Node, Relationship, Topic, Concept, Student, StudentNote,
    StudentQuizHistory, StudentBloomRecord, Conversation, Message
)

# Node & Topic / Concept
admin.site.register(Node)
admin.site.register(Relationship)
admin.site.register(Topic)
admin.site.register(Concept)
admin.site.register(Module)
admin.site.register(Student)
admin.site.register(StudentNote)

# Quiz history
@admin.register(StudentQuizHistory)
class StudentQuizHistoryAdmin(admin.ModelAdmin):
    list_display = ('student', 'module', 'quiz_type', 'score', 'completed', 'created_at')
    list_filter = ('quiz_type', 'completed', 'module')
    search_fields = ('student__name', 'module__name')
    readonly_fields = ('created_at', 'updated_at', 'quiz_data', 'student_answers')
    filter_horizontal = ('topics_covered',)  # ManyToMany field

# Bloom record
@admin.register(StudentBloomRecord)
class StudentBloomRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'module')
    readonly_fields = ('last_processed_msg_id',)

# Conversation
@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('convo_id', 'student', 'module', 'convo_title', 'convo_created_date', 'convo_duration')
    list_filter = ('module',)
    search_fields = ('student__name', 'convo_title')

# Message
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('msg_id', 'conversation', 'student', 'module', 'msg_sender', 'msg_timestamp')
    list_filter = ('module', 'msg_sender')
    search_fields = ('student__name', 'conversation__convo_title')
    readonly_fields = ('msg_context', 'msg_text', 'msg_user_feedback', 'msg_evaluation')
