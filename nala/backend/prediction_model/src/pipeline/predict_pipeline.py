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
            model_path = "/Users/School/Desktop/Repos/NALA-LearnScape/nala/backend/prediction_model/artifacts/model.pkl"
            preprocessor_path = "/Users/School/Desktop/Repos/NALA-LearnScape/nala/backend/prediction_model/artifacts/preprocessor.pkl"
            model=load_object(model_path)
            preprocessor=load_object(preprocessor_path)
            print("After Loading")
            data_scaled=preprocessor.transform(features)
            preds=model.predict(data_scaled)
            print("Predictions:", preds)
            return preds
        
        except Exception as e:
            raise CustomException(e,sys)