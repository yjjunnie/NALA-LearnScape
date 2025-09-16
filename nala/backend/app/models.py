from django.db import models

class Node(models.Model):
    name = models.CharField(max_length=255, unique=True)
    summary = models.TextField(max_length=500, unique=True)

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
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='topic')
    
    def __str__(self):
        return f'Concept: {self.name} of topic "{self.topic.name}" '
    
