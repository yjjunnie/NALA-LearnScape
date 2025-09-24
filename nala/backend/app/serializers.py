from rest_framework import serializers
from .models import (Module, Node, Relationship, Student, Topic, Concept)

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'index', 'name', 'created_at']

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

class StudentSerializer(serializers.ModelSerializer):
    enrolled_modules_info = serializers.SerializerMethodField()
    learning_style_description = serializers.SerializerMethodField()
    learning_style_display = serializers.CharField(source='get_learningStyle_display', read_only=True)
    
    class Meta:
        model = Student
        fields = ['id', 'name', 'email', 'enrolled_modules', 'learningStyle',
                 'enrolled_modules_info', 'learning_style_description', 'learning_style_display']
    
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