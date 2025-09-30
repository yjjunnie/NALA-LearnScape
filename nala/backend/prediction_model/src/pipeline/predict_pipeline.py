import os
import sys
import pandas as pd

from src.exception import CustomException
from src.utils import load_object

class PredictPipeline:
    def __init__(self):
        # Get the absolute path to the current file’s directory
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        # Build the path to the artifacts folder dynamically
        self.artifacts_dir = os.path.join(self.current_dir, "artifacts")

    def predict(self,features):
        try:
            print("here")
            print("Before Loading")
            model_path = os.path.join(self.artifacts_dir, "model.pkl")
            preprocessor_path = os.path.join(self.artifacts_dir, "preprocessor.pkl")
            model=load_object(model_path)
            preprocessor=load_object(preprocessor_path)
            print("After Loading")
            data_scaled=preprocessor.transform(features)
            preds=model.predict(data_scaled)
            print("Predictions:", preds)
            return preds
        
        except Exception as e:
            raise CustomException(e,sys)