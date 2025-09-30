import os
from pathlib import Path
import sys
import pandas as pd

from src.exception import CustomException
from src.utils import load_object

class PredictPipeline:
    def __init__(self):
        self.artifacts_dir = Path(__file__).resolve().parents[2] / "artifacts"


    def predict(self,features):
        try:
            print("here")
            print("Before Loading")
            # Build dynamic file paths
            model_path = self.artifacts_dir / "model.pkl"
            preprocessor_path = self.artifacts_dir / "preprocessor.pkl"
            
            model=load_object(model_path)
            preprocessor=load_object(preprocessor_path)
            print("After Loading")
            data_scaled=preprocessor.transform(features)
            preds=model.predict(data_scaled)
            print("Predictions:", preds)
            return preds
        
        except Exception as e:
            raise CustomException(e,sys)