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
from src.pipeline.predict_pipeline import PredictPipeline  

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Dummy data functions
def get_blooms_level(student_id, topic_id):
    dummy_blooms = {
        ("student123", "1"): "understand",
        ("student123", "2"): "apply",
        ("student123", "3"): "analyze",
        ("student456", "1"): "remember",
        ("student456", "2"): "understand"
    }
    return dummy_blooms.get((student_id, topic_id), "analyze")

def get_topic_difficulty(topic_id):
    dummy_difficulties = {
        "1": 5,
        "2": 5,
        "3": 2,
        "4": 6,
        "5": 2
    }
    return dummy_difficulties.get(str(topic_id), 3)

def get_previous_grades(student_id, topic_id):
    """Get student's previous grades for this topic - DUMMY DATA for now"""
    dummy_grades = {
        "student123": {
            "1": 66,
            "2": 99,
            "3": 99,
            "4": 99,
            "5": 99
        },
        "student456": {
            "1": 33,
            "2": 32,
            "3": 80,
            "4": 22,
            "5": 87
        }
    }
    return dummy_grades.get(student_id, {}).get(str(topic_id), 80)

def get_student_topics(student_id):
    dummy_topics = [
        {"topic_id": "1", "topic_name": "Linear Algebra - Vectors"},
        {"topic_id": "2", "topic_name": "Calculus - Integrals"},
        {"topic_id": "3", "topic_name": "Data Structures - Trees"},
        {"topic_id": "4", "topic_name": "Algorithms - Sorting"},
        {"topic_id": "5", "topic_name": "Probability Theory - Distributions"}
    ]
    return dummy_topics

def get_exam_date(student_id, topic_id):
    dummy_exam_dates = {
        ("student123", "1"): "2025-10-01", # exam #1 to focus on
        ("student123", "2"): "2025-09-15", # exam already passed
        ("student123", "3"): "2025-10-03", # exam #2 to focus on
        ("student123", "4"): "2025-12-01",
        ("student123", "5"): "2025-12-15",
        ("student456", "1"): "2025-10-01", # exam #1 to focus on
        ("student456", "2"): "2025-09-15", # exam already passed
        ("student456", "3"): "2025-10-03", # exam #2 to focus on
        ("student456", "4"): "2025-12-01",
        ("student456", "5"): "2025-12-15"
    }
    return dummy_exam_dates.get((student_id, topic_id), "2024-02-01")

def get_preferred_study_start_time(student_id):
    dummy_study_times = {
        "student123": "08:30",  
        "student456": "18:33"  
    }
    return dummy_study_times.get(student_id, 9)  # default to 9 AM

def get_preffered_break_time_between_studying(student_id):
    dummy_break_times = {
        "student123": 30,  
        "student456": 10  
    }
    return dummy_break_times.get(student_id, 10)  # default to 10 minutes

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
    Returns: JSON with predicted study hours for all topics
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
            exam_date = get_exam_date(student_id, topic_id)  # Not used in prediction
            preferred_study_time = get_preferred_study_start_time(student_id)  # Not used in prediction
            
            # Handle case where Bloom's level is not found
            if blooms_level is None:
                blooms_level = "Remember"
            
            # Prepare DataFrame for prediction
            pred_df = prepare_prediction_dataframe(
                blooms_level, 
                topic_difficulty, 
                previous_grade
            )
            
            print(f"\n=== Predicting for topic {topic_id}: {topic['topic_name']} ===")
            print(f"Input features:\n{pred_df}")
            
            # Make prediction
            predicted_hours = predict_pipeline.predict(pred_df)
            
            print(f"Raw prediction output: {predicted_hours}")
            
            # Extract the prediction value
            if isinstance(predicted_hours, (list, np.ndarray)):
                predicted_hours = float(predicted_hours[0])
            elif hasattr(predicted_hours, 'item'):
                predicted_hours = float(predicted_hours.item())
            else:
                predicted_hours = float(predicted_hours)
            
            print(f"Predicted study hours: {predicted_hours:.2f}\n")
            
            # Add to results
            results.append({
                'topic_id': topic_id,
                'topic_name': topic['topic_name'],
                'actual_study_hours': round(predicted_hours, 2),  # Changed from predicted_hours
                'student_grade_history': previous_grade,
                'blooms_level': blooms_level,
                'topic_difficulty': topic_difficulty,
                'exam_date': exam_date,
                'preferred_study_time': preferred_study_time,
                'break_time_between_studying': get_preffered_break_time_between_studying(student_id)
            })
        
        return jsonify({
            'success': True,
            'student_id': student_id,
            'topics': results,
            'total_topics': len(results),
            'message': 'Predictions generated successfully'
        })
    
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get predictions'
        }), 500

# Single topic prediction endpoint
@app.route('/predict', methods=['POST'])
def predict_single_topic():
    """
    Endpoint for predicting a single topic
    Request body: {"student_id": "...", "topic_id": "..."}
    """
    try:
        data = request.json
        student_id = data.get('student_id')
        topic_id = data.get('topic_id')
        
        if not student_id or not topic_id:
            return jsonify({
                'success': False,
                'error': 'Missing student_id or topic_id'
            }), 400
        
        # Get the three inputs
        blooms_level = get_blooms_level(student_id, topic_id)
        topic_difficulty = get_topic_difficulty(topic_id)
        previous_grade = get_previous_grades(student_id, topic_id)
        
        if blooms_level is None:
            blooms_level = "Remember"
        
        # Prepare DataFrame - FIXED: removed student_id and topic_id parameters
        pred_df = prepare_prediction_dataframe(
            blooms_level, 
            topic_difficulty, 
            previous_grade
        )
        
        print(f"\n=== Single Topic Prediction ===")
        print(f"Student: {student_id}, Topic: {topic_id}")
        print(f"Input features:\n{pred_df}")
        
        # Make prediction
        predict_pipeline = PredictPipeline()
        predicted_hours = predict_pipeline.predict(pred_df)
        
        print(f"Raw prediction: {predicted_hours}")
        
        # Extract value
        if isinstance(predicted_hours, (list, np.ndarray)):
            predicted_hours = float(predicted_hours[0])
        elif hasattr(predicted_hours, 'item'):
            predicted_hours = float(predicted_hours.item())
        else:
            predicted_hours = float(predicted_hours)
        
        print(f"Predicted study hours: {predicted_hours:.2f}\n")
        
        return jsonify({
            'success': True,
            'actual_study_hours': round(predicted_hours, 2),  # Changed from predicted_hours
            'student_grade_history': previous_grade,
            'blooms_level': blooms_level,
            'topic_difficulty': topic_difficulty,
            'student_id': student_id,
            'topic_id': topic_id
        })
    
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Prediction failed'
        }), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'API is running',
        'endpoints': {
            'health': '/health',
            'all_topics': '/student/<student_id>/topics',
            'single_prediction': '/predict (POST)'
        }
    })

if __name__ == '__main__':
    print("Starting Flask API...")
    print("Available endpoints:")
    print("  GET  /health")
    print("  GET  /student/<student_id>/topics")
    print("  POST /predict")
    app.run(host="0.0.0.0", port=5000, debug=True)