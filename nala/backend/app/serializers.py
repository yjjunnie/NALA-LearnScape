from rest_framework import serializers
from .models import (Module, Node, Relationship, Student, Topic, Concept, StudentNote)

class ModuleSerializer(serializers.ModelSerializer):
    topics = serializers.SerializerMethodField() 

    class Meta:
        model = Module
        fields = ['id', 'index', 'name', 'created_at', 'topics']

    def get_topics(self, obj):
        topics = Topic.objects.filter(module=obj)
        return TopicSerializer(topics, many=True).data

class NodeSerializer(serializers.ModelSerializer):
    module_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Node
        fields = ['id', 'name', 'summary', 'module', 'module_info']
    
    def get_module_info(self, obj): 
        if obj.module:
            return {
                'id': obj.module.id,
                'index': obj.module.index,
                'name': obj.module.name
            }
        return None

class TopicSerializer(serializers.ModelSerializer):
    module_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Topic
        fields = ['id', 'name', 'summary', 'module', 'module_info']
        # All Node fields are automatically included
    
    def get_module_info(self, obj):
        if obj.module:
            return {
                'id': obj.module.id,
                'index': obj.module.index,
                'name': obj.module.name
            }
        return None
    
class ThreadMapTopicSerializer(serializers.ModelSerializer):
    module_id = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    class Meta:
        model = Topic
        fields = ['id', 'type', 'name', 'summary', 'module_id']
    def get_module_id(self, obj):
        if obj.module is None:
            return None
        return str(obj.module_id)
    def get_type(self, obj):
        return 'topic'

class ConceptSerializer(serializers.ModelSerializer):
    module_info = serializers.SerializerMethodField()
    topic_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Concept
        fields = ['id', 'name', 'summary', 'module', 'related_topic', 
                 'module_info', 'topic_info']
        # Includes all Node fields + Concept-specific fields
    
    def get_module_info(self, obj):
        if obj.module:
            return {
                'id': obj.module.id,
                'index': obj.module.index,
                'name': obj.module.name
            }
        return None
    
    def get_topic_info(self, obj):
        if obj.related_topic:
            return {
                'id': obj.related_topic.id,
                'name': obj.related_topic.name,
                'module_index': obj.related_topic.module.index if obj.related_topic.module else None
            }
        return None

class ThreadMapConceptSerializer(serializers.ModelSerializer):
    module_id = serializers.SerializerMethodField()
    related_topic = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    def get_type(self, obj):
        return 'concept'
    
    class Meta:
        model = Concept
        fields = ['id', 'type', 'name', 'summary', 'related_topic', 'module_id',]
        
    def get_module_id(self, obj):
        if obj.module is None:
            return None
        return str(obj.module_id)

    def get_related_topic(self, obj):
        if obj.related_topic is None:
            return None
        return str(obj.related_topic_id)
        
class RelationshipSerializer(serializers.ModelSerializer):
    first_node_info = serializers.SerializerMethodField()
    second_node_info = serializers.SerializerMethodField()
    rs_type_display = serializers.CharField(source='get_rs_type_display', read_only=True)
    
    class Meta:
        model = Relationship
        fields = ['id', 'first_node', 'second_node', 'rs_type', 'rs_type_display',
                 'first_node_info', 'second_node_info']
    
    def get_first_node_info(self, obj):
        return {
            'id': obj.first_node.id,
            'name': obj.first_node.name
        }
    
    def get_second_node_info(self, obj):
        return {
            'id': obj.second_node.id,
            'name': obj.second_node.name
        }
        
class ThreadMapRelationshipSerializer(serializers.ModelSerializer):
    first_node = serializers.CharField(source='first_node.id', read_only=True)
    second_node = serializers.CharField(source='second_node.id', read_only=True)
    
    class Meta:
        model = Relationship
        fields = ['id', 'first_node', 'second_node', 'rs_type']

class StudentSerializer(serializers.ModelSerializer):
    enrolled_modules_info = serializers.SerializerMethodField()
    learning_style_description = serializers.SerializerMethodField()
    learning_style_display = serializers.CharField(source='get_learningStyle_display', read_only=True)
    learningStyleBreakdown = serializers.JSONField(read_only=True) 
    
    class Meta:
        model = Student
        fields = ['id', 'name', 'email', 'enrolled_modules', 'learningStyle',
                 'enrolled_modules_info', 'learning_style_description', 
                 'learning_style_display', 'learningStyleBreakdown'] 
    
    def get_enrolled_modules_info(self, obj):
        return [
            {
                'id': module.id,
                'index': module.index,
                'name': module.name
            }
            for module in obj.enrolled_modules.all()
        ]
    
    def get_learning_style_description(self, obj):
        return obj.get_learning_style_description()

class TopicWithConceptsSerializer(serializers.ModelSerializer):
    concepts = serializers.SerializerMethodField()
    module_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Topic
        fields = ['id', 'name', 'summary', 'module', 'module_info', 'concepts']
    
    def get_concepts(self, obj):
        concepts = Concept.objects.filter(related_topic=obj).order_by('id')
        return [{
            'id': concept.id,
            'name': concept.name,
            'description': concept.summary 
        } for concept in concepts]
    
    def get_module_info(self, obj):
        if obj.module:
            return {
                'id': obj.module.id,
                'index': obj.module.index,
                'name': obj.module.name
            }
        return None

class StudentNoteSerializer(serializers.ModelSerializer):
    """
    Serializer for StudentNote model
    """
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    
    class Meta:
        model = StudentNote
        fields = ['id', 'student', 'topic', 'content', 'created_at', 
                 'updated_at', 'topic_name', 'student_name']
        read_only_fields = ['created_at', 'updated_at']