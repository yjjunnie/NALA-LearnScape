import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nala_backend.settings')
django.setup()

from flask import Flask, request, render_template, jsonify
import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from flask_cors import CORS
#from app.models import StudentBloomLevel  
from src.pipeline.predict_pipeline import PredictPipeline  

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

"""# Bloom's level helper functions (your existing code)
BLOOM_ORDER = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]

def get_highest_blooms_level(blooms_dict):
    if not blooms_dict:
        return None
    for level in reversed(BLOOM_ORDER):
        if blooms_dict.get(level, 0) > 0:
            return level
    return None

def get_blooms_level(student_id, topic_id):
    try:
        entry = StudentBloomLevel.objects.get(student_id=student_id, node_id=topic_id)
        return get_highest_blooms_level(entry.blooms_level)
    except StudentBloomLevel.DoesNotExist:
        return None
"""

# Dummy data functions (replace these with real DB queries later)
def get_blooms_level(student_id, topic_id):
    """Fetch Bloom's level for a given student + topic - DUMMY DATA for now"""
    dummy_blooms = {
        ("student123", "1"): "Understand",
        ("student123", "2"): "Apply",
        ("student123", "3"): "Analyze",
        ("student456", "1"): "Remember",
        ("student456", "2"): "Understand"
    }
    return dummy_blooms.get((student_id, topic_id), "Analyze") # Default to "Analyze"

def get_topic_difficulty(topic_id):
    """Get topic difficulty - DUMMY DATA for now"""
    dummy_difficulties = {
        "1": 4,
        "2": 3,
        "3": 5,
        "4": 2,
        "5": 4
    }
    return dummy_difficulties.get(str(topic_id), 3)  # Default to 3

def get_previous_grades(student_id, topic_id):
    """Get student's previous grades for this topic - DUMMY DATA for now"""
    dummy_grades = {
        "student123": {
            "1": 85,
            "2": 90,
            "3": 75,
            "4": 88,
            "5": 82
        },
        "student456": {
            "1": 78,
            "2": 85,
            "3": 80,
            "4": 92,
            "5": 87
        }
    }
    return dummy_grades.get(student_id, {}).get(str(topic_id), 80)  # Default to 80

def get_student_topics(student_id):
    """Get all topics for a student - DUMMY DATA for now"""
    dummy_topics = [
        {"topic_id": "1", "topic_name": "Linear Algebra - Vectors"},
        {"topic_id": "2", "topic_name": "Calculus - Integrals"},
        {"topic_id": "3", "topic_name": "Data Structures - Trees"},
        {"topic_id": "4", "topic_name": "Algorithms - Sorting"},
        {"topic_id": "5", "topic_name": "Probability Theory - Distributions"}
    ]
    return dummy_topics

def prepare_prediction_dataframe(blooms_level, topic_difficulty, previous_grade):
    data = {
        'blooms_level': [blooms_level],
        'topic_difficulty': [topic_difficulty],
        'previous_grade': [previous_grade]
    }
    
    pred_df = pd.DataFrame(data)
    return pred_df

# Main endpoint for getting all topics with predictions
@app.route('/student/<student_id>/topics', methods=['GET'])
def get_topics_with_predictions(student_id):
    """
    Main endpoint: Get all topics for a student with AI predictions
    """
    try:
        # 1. Get all topics for the student
        topics = get_student_topics(student_id)
        
        # 2. Initialize prediction pipeline
        predict_pipeline = PredictPipeline()
        
        results = []
        
        # 3. For each topic, get data and make prediction
        for topic in topics:
            topic_id = topic['topic_id']
            
            # Get the three inputs
            blooms_level = get_blooms_level(student_id, topic_id)
            topic_difficulty = get_topic_difficulty(topic_id)
            previous_grade = get_previous_grades(student_id, topic_id)
            
            # Handle case where Bloom's level is not found
            if blooms_level is None:
                blooms_level = "Remember"
            
            # Prepare DataFrame for prediction
            pred_df = prepare_prediction_dataframe(
                blooms_level, 
                topic_difficulty, 
                previous_grade
            )
            
            print(f"Predicting for topic {topic_id}:")
            print(pred_df)
            print("Before Prediction")
            
            # Make prediction
            predicted_hours = predict_pipeline.predict(pred_df)
            
            print("After prediction")
            print(f"Predicted hours: {predicted_hours}")
            
            # Extract the prediction value (adjust based on your pipeline output)
            if isinstance(predicted_hours, list):
                predicted_hours = float(predicted_hours[0])
            elif hasattr(predicted_hours, 'item'):
                predicted_hours = float(predicted_hours.item())
            else:
                predicted_hours = float(predicted_hours)
            
            # Add to results
            results.append({
                'topic_id': topic_id,
                'topic_name': topic['topic_name'],
                'predicted_hours': round(predicted_hours, 2),
                'student_grade_history': previous_grade,
                'blooms_level': blooms_level,
                'topic_difficulty': topic_difficulty
            })
        
        return jsonify({
            'topics': results,
            'student_id': student_id,
            'message': 'Predictions generated successfully'})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'error': str(e),
            'message': 'Failed to get predictions'
        }), 500

# Optional: Single topic prediction endpoint
@app.route('/predict', methods=['POST'])
def predict_single_topic():
    """
    Optional endpoint for predicting a single topic
    Request body: {"student_id": "...", "topic_id": "..."}
    """
    try:
        data = request.json
        student_id = data.get('student_id')
        topic_id = data.get('topic_id')
        
        if not student_id or not topic_id:
            return jsonify({'error': 'Missing student_id or topic_id'}), 400
        
        # Get the three inputs
        blooms_level = get_blooms_level(student_id, topic_id)
        topic_difficulty = get_topic_difficulty(topic_id)
        previous_grade = get_previous_grades(student_id, topic_id)
        
        if blooms_level is None:
            blooms_level = "Remember"
        
        # Prepare DataFrame
        pred_df = prepare_prediction_dataframe(
            student_id, 
            topic_id, 
            blooms_level, 
            topic_difficulty, 
            previous_grade
        )
        
        print("Before Prediction")
        print(pred_df)
        
        # Make prediction
        predict_pipeline = PredictPipeline()
        predicted_hours = predict_pipeline.predict(pred_df)
        
        print("After prediction")
        
        # Extract value
        if isinstance(predicted_hours, list):
            predicted_hours = float(predicted_hours[0])
        elif hasattr(predicted_hours, 'item'):
            predicted_hours = float(predicted_hours.item())
        else:
            predicted_hours = float(predicted_hours)
        
        return jsonify({
            'predicted_hours': round(predicted_hours, 2),
            'student_grade_history': previous_grade,
            'blooms_level': blooms_level,
            'topic_difficulty': topic_difficulty
        })
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'error': str(e),
            'message': 'Prediction failed'
        }), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'API is running'})

if __name__ == '__main__':
    app.run(host="0.0.0.0",debug=True)