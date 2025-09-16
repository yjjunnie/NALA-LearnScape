from django.db import models

# ThreadMap
class Node(models.Model):
    name = models.CharField(max_length=255, unique=True)
    summary = models.TextField()

    def __str__(self):
        return f'Node: {self.name}'
    
class Relationship(models.Model):
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

class Topic(Node):
    def __str__(self):
        return f'Topic: {self.name}'
    
class Concept(Node):
    related_topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    
    def __str__(self):
        return f'Concept: {self.name} of topic "{self.topic.name}" '

# Course and Student
class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Course: {self.title}'

class Student(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    enrolled_courses = models.ManyToManyField(Course, related_name='students', blank=True)

    def __str__(self):
        return f'Student: {self.name}'
    

