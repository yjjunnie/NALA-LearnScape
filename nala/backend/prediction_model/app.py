from flask import Flask, request, render_template
import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from src.pipeline.predict_pipeline import CustomData, PredictPipeline

application=Flask(__name__)

app=application

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predictdata', methods=['GET','POST'])
def predict_datapoint():
    if request.method =='GET':
        return render_template('home.html')
    else:
        data=CustomData(
            gpa=float(request.form.get('gpa')),
            learning_speed=float(request.form.get('learning_speed')),
            motivation_level=float(request.form.get('motivation_level')),
            retrieval_practice_count=float(request.form.get('retrieval_practice_count')),
            elaboration_count=float(request.form.get('elaboration_count')),
            concrete_examples_count=float(request.form.get('concrete_examples_count')), 
            interleaving_count=float(request.form.get('interleaving_count')),
            dual_coding_count=float(request.form.get('dual_coding_count')),
            topic_difficulty=float(request.form.get('topic_difficulty')),
            prerequisite_knowledge=float(request.form.get('prerequisite_knowledge')),
            topic_weakness_score=float(request.form.get('topic_weakness_score')),
            conversation_duration=float(request.form.get('conversation_duration')),
            questions_per_topic=float(request.form.get('questions_per_topic')),
            actual_study_hours=float(request.form.get('actual_study_hours'))
        )
        pred_df = data.get_data_as_data_frame()
        print(pred_df)

        print("Before Prediction")
        predict_pipeline = PredictPipeline()
        results = predict_pipeline.predict(pred_df)
        print("after prediction")

        return render_template('home.html',results=results[0])

if __name__ == "__main__":
    app.run(host="0.0.0.0",debug=True)