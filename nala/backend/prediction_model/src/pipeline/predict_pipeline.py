import os
import sys
import pandas as pd

from src.exception import CustomException
from src.utils import load_object

class PredictPipeline:
    def __init__(self):
        pass

    def predict(self,features,topic):
        try:
            print("here")
            model_path = os.path.join("artifacts","model.pkl")
            preprocessor_path=os.path.join('artifacts','preprocessor.pkl')

            print("Before Loading")
            model=load_object(file_path=model_path)
            preprocessor=load_object(file_path=preprocessor_path)

            filtered_features = features[features["topic"] == topic]
            if filtered_features.empty:
                raise ValueError(f"No data found for topic: {topic}")
            
            # drop topic column as not needed for prediction, as filtering = all topics are the same
            filtered_features = filtered_features.drop(columns=["topic"], axis=1)

            print("After Loading")
            data_scaled=preprocessor.transform(filtered_features)

            preds=model.predict(data_scaled)
            print("Predictions:", preds)
            return preds
        
        except Exception as e:
            raise CustomException(e,sys)
    

class CustomData:
    def __init__(  self,
        student_id: int,
        overall_grade: str,
        topic: str,
        topic_difficulty: int,
        topic_complexity: str,
        topic_type: str,
        prerequisite_count: int):

        self.student_id = student_id
        self.overall_grade = overall_grade
        self.topic = topic
        self.topic_difficulty = topic_difficulty
        self.topic_complexity = topic_complexity
        self.topic_type = topic_type
        self.prerequisite_count = prerequisite_count

    def get_data_as_data_frame(self):
        try:
            custom_data_input_dict = {
                "student_id": [self.student_id],
                "overall_grade": [self.overall_grade],
                "topic": [self.topic],
                "topic_difficulty": [self.topic_difficulty],
                "topic_complexity": [self.topic_complexity],
                "topic_type": [self.topic_type],
                "prerequisite_count": [self.prerequisite_count],
            }

            return pd.DataFrame(custom_data_input_dict)

        except Exception as e:
            raise CustomException(e, sys)

