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
    
class Student(models.Model):
    LEARNING_STYLE_CHOICES = [
        ('RETRIEVAL', 'Retrieval Practice'),
        ('SPACED', 'Spaced Practice'),
        ('ELABORATION', 'Elaboration'),
        ('CONCRETE', 'Concrete Examples'),
        ('INTERLEAVING', 'Interleaving'),
        ('DUAL_CODING', 'Dual Coding'),
    ]
    
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    enrolled_modules = models.ManyToManyField(Module, related_name='students', blank=True)
    
    learningStyleBreakdown = models.JSONField(default=dict, blank=True)
    
    learningStyle = models.CharField(
        max_length=20, 
        choices=LEARNING_STYLE_CHOICES,
        default='RETRIEVAL',
        blank=True,
        null=True
    )

    def get_learning_style_description(self):
        """Get description for the current learning style."""
        # Auto-determine primary style from breakdown
        if self.learningStyleBreakdown:
            key_map = {'Retrieval Practice': 'RETRIEVAL', 'Elaboration': 'ELABORATION', 
                      'Concrete Examples': 'CONCRETE', 'Interleaving': 'INTERLEAVING', 'Dual Coding': 'DUAL_CODING'}
            primary = max((k for k in self.learningStyleBreakdown if k in key_map), 
                         key=lambda k: self.learningStyleBreakdown[k], default=None)
            if primary:
                self.learningStyle = key_map[primary]
        
        descriptions = {
            "RETRIEVAL": "Testing yourself to strengthen memory and recall",
            "ELABORATION": "Explaining discrete ideas with many details",
            "CONCRETE": "Use specific examples to understand abstract ideas",
            "INTERLEAVING": "Mixing different topics or skills during study sessions",
            "DUAL_CODING": "Using both visual and verbal information processing",
        }
        return descriptions.get(self.learningStyle, "")
    
    def __str__(self):
        return f'Student: [{self.id}] {self.name}'

class Topic(Node):
    def __str__(self):
        return f'[{self.module.index if self.module else "No Module"}] Topic: {self.name or "Unnamed"}'
    
class Concept(Node):
    related_topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    
    def __str__(self):
         return f'Concept: {self.name or "Unnamed"} [ [{self.related_topic.module.index if self.related_topic and self.related_topic.module else "No Module"}] Topic "{self.related_topic.name if self.related_topic else "No Topic"}"]'