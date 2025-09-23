from django.db import models

class Module(models.Model):
    id = models.IntegerField(primary_key=True)
    index = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Module: {self.index} {self.name}'
    
# ThreadMap
class Node(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    summary = models.TextField()
    module = models.ForeignKey(Module, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f'Node: {self.name}'
    
class Relationship(models.Model):
    id = models.IntegerField(primary_key=True)
    first_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='first_node_of_rs')
    second_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='second_node_of_rs')

    rs_type = models.CharField(max_length=255, choices=[
        ('is_subtopic_of', 'Is_Subtopic_Of'),
        ('is_prerequisite_of', 'Is_Prerequisite_Of'),
        ('is_corequisite_of', 'Is_Corequisite_Of'),
        ('is_contrasted_with', 'Is_Contrasted_With'),
        ('is_applied_in', 'Is_Applied_In')
    ])
    
    def __str__(self):
        return f'Relationship: {self.first_node.name} {self.rs_type} {self.second_node.name}'
    
#Student
class Student(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    enrolled_modules = models.ManyToManyField(Module, related_name='students', blank=True)

    def __str__(self):
        return f'Student: {self.name}'

class Topic(Node):
    def __str__(self):
        return f'[{self.module.index if self.module else "No Module"}] Topic: {self.name or "Unnamed"}'
    
class Concept(Node):
    related_topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    
    def __str__(self):
         return f'Concept: {self.name or "Unnamed"} [ [{self.related_topic.module.index if self.related_topic and self.related_topic.module else "No Module"}] Topic "{self.related_topic.name if self.related_topic else "No Topic"}"]'


