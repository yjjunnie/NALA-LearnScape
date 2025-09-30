from django.db import models

# === Modules ===
class Module(models.Model):
    id = models.CharField(primary_key=True, max_length=255)
    index = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Module: {self.index} {self.name}'


# === ThreadMap Nodes ===
class Node(models.Model):
    id = models.CharField(primary_key=True, max_length=255)
    name = models.CharField(max_length=255, blank=True, null=True) 
    summary = models.TextField(blank=True, null=True)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, blank=True, null=True)
    week_no = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.name or f'Node-{self.id}'


# === Relationships between Nodes ===
class Relationship(models.Model):
    RELATIONSHIP_CHOICES = [
        ('is_subtopic_of', 'Is_Subtopic_Of'),
        ('is_prerequisite_of', 'Is_Prerequisite_Of'),
        ('is_corequisite_of', 'Is_Corequisite_Of'),
        ('is_contrasted_with', 'Is_Contrasted_With'),
        ('is_applied_in', 'Is_Applied_In'),
    ]

    id = models.CharField(primary_key=True, max_length=255)
    first_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='first_node_of_rs')
    second_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='second_node_of_rs')
    rs_type = models.CharField(max_length=255, choices=RELATIONSHIP_CHOICES)
    week_no = models.CharField(max_length=50, blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.first_node and self.second_node:
            week_nos = [wn for wn in [self.first_node.week_no, self.second_node.week_no] if wn]
            self.week_no = max(week_nos) if week_nos else None
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Relationship: {self.first_node.name} {self.rs_type} {self.second_node.name}'


# === Student ===
class Student(models.Model):
    LEARNING_STYLE_CHOICES = [
        ('RETRIEVAL', 'Retrieval Practice'),
        ('SPACED', 'Spaced Practice'),
        ('ELABORATION', 'Elaboration'),
        ('CONCRETE', 'Concrete Examples'),
        ('INTERLEAVING', 'Interleaving'),
        ('DUAL_CODING', 'Dual Coding'),
    ]

    id = models.CharField(primary_key=True, max_length=255)
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
        key_map = {
            'Retrieval Practice': 'RETRIEVAL',
            'Elaboration': 'ELABORATION',
            'Concrete Examples': 'CONCRETE',
            'Interleaving': 'INTERLEAVING',
            'Dual Coding': 'DUAL_CODING'
        }
        if self.learningStyleBreakdown:
            primary = max(
                (k for k in self.learningStyleBreakdown if k in key_map),
                key=lambda k: self.learningStyleBreakdown[k],
                default=None
            )
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


# === Topic and Concept ===
class Topic(Node):
    class Meta:
        verbose_name = "Topic"
        verbose_name_plural = "Topics"

    def __str__(self):
        module_idx = self.module.index if self.module else "No Module"
        name = self.name or "Unnamed"
        return f'[{module_idx}] Topic: {name}'


class Concept(Node):
    related_topic = models.ForeignKey(Topic, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        verbose_name = "Concept"
        verbose_name_plural = "Concepts"

    def __str__(self):
        name = self.name or "Unnamed"
        if self.related_topic:
            topic_name = self.related_topic.name
            module_idx = self.related_topic.module.index if self.related_topic.module else "No Module"
            return f'Concept: {name} [{module_idx}] Topic "{topic_name}"'
        return f'Concept: {name} [No Topic]'


# === Notes ===
class StudentNote(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='topic_notes')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='student_notes')
    content = models.TextField(blank=True, help_text="Student's notes in JSON/HTML format")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_notes'
        unique_together = ('student', 'topic')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.student.name} - {self.topic.name}"


# === Quiz History ===
class StudentQuizHistory(models.Model):
    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='quiz_histories')
    module = models.ForeignKey(Module, on_delete=models.SET_NULL, null=True, blank=True)
    quiz_data = models.JSONField(default=dict)
    student_answers = models.JSONField(default=dict, blank=True)
    score = models.FloatField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    quiz_type = models.CharField(max_length=20, choices=[("weekly", "Weekly"), ("custom", "Custom")], default="weekly")
    topics_covered = models.ManyToManyField(Topic, related_name="quizzes", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"QuizHistory: {self.student.name} - Module: {self.module.name if self.module else 'N/A'} ({self.quiz_type})"


# === Bloom Records ===
class StudentBloomRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="bloom_records")
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="bloom_records")
    bloom_summary = models.JSONField(default=dict, blank=True)
    last_processed_msg_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        unique_together = ("student", "module")

    def __str__(self):
        return f"BloomRecord: {self.student.name} - {self.module.name}"


# === Conversations and Messages ===
class Conversation(models.Model):
    convo_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='conversations')
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='conversations')
    convo_title = models.CharField(max_length=500)
    convo_created_date = models.DateTimeField(auto_now_add=True)
    convo_duration = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'conversation'
        ordering = ['-convo_created_date']


class Message(models.Model):
    msg_id = models.AutoField(primary_key=True)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='messages')
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='messages')
    msg_sender = models.CharField(max_length=20)  # 'user' or 'assistant'
    msg_text = models.TextField()
    msg_timestamp = models.DateTimeField(auto_now_add=True)
    msg_context = models.JSONField(null=True, blank=True)
    msg_evaluation = models.CharField(max_length=255, null=True, blank=True)
    msg_user_feedback = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'message'
        ordering = ['msg_timestamp']
        indexes = [
            models.Index(fields=['student', 'module']),
            models.Index(fields=['conversation', 'msg_timestamp']),
        ]
