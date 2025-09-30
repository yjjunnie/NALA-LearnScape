import os
import sys
import pandas as pd

from src.exception import CustomException
from src.utils import load_object

class PredictPipeline:
    def __init__(self):
        pass

    def predict(self,features):
        try:
            print("here")
            print("Before Loading")
            model = r"C:\Users\holly\OneDrive\Documents\NALA-LearnScape\nala\backend\prediction_model\artifacts\model.pkl"
            preprocessor = r"C:\Users\holly\OneDrive\Documents\NALA-LearnScape\nala\backend\prediction_model\artifacts\preprocessor.pkl"
            
            model=load_object(file_path=model)
            preprocessor=load_object(file_path=preprocessor)
            print("After Loading")
            data_scaled=preprocessor.transform(features)
            preds=model.predict(data_scaled)
            print("Predictions:", preds)
            return preds
        
        except Exception as e:
            raise CustomException(e,sys)