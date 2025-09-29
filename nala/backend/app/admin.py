from django.contrib import admin
from .models import *

admin.site.register(Node)
admin.site.register(Relationship)
admin.site.register(Topic)
admin.site.register(Concept)
admin.site.register(Module)
admin.site.register(Student)
admin.site.register(StudentNote)
admin.site.register(StudentQuizHistory)