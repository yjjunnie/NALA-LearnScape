from django.db import models

class Node(models.Model):
    node_type = models.CharField(max_length=255)
    node_name = models.CharField(max_length=255, unique=True)
    node_desc = models.CharField(max_length=500, unique=True)

    def __str__(self):
        return self.name
    
class Relationship(models.Model):
    first_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='first_node_of_rs')
    second_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='second_node_of_rs')

    rs_type = models.CharField(max_length=255, choices=[
        ('is_subtopic', 'Is_Subtopic'),
        ('is_prerequisite', 'Is_Prerequisite'),
        ('is_corequisite', 'Is_Corequisite'),
        ('is_equivalent', 'Is_Equivalent'),
        ('', ''),
        
    ])
    