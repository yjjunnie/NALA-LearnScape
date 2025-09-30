# ******************************************************************
# * Data Transformation : Main purpose is to do                    *
# *                       -> Data Cleaning                         *
# *                       -> convert cat to num, etc.              *
# ******************************************************************
import sys
from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer  # create pipeline for ohc or standardscaling, if want to use in form of pipeline
from sklearn.impute import SimpleImputer # for missing data
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.exception import CustomException
from src.logger import logging
import os

from src.utils import save_object

@dataclass
class DataTransformationConfig:
    preprocessor_obj_file_path = os.path.join('artifacts', 'preprocessor.pkl')

class DataTransformation:
    
    def __init__(self):
        self.data_transformation_config = DataTransformationConfig()

    def get_data_transformer_object(self):

        '''
        This fuction is resposible for Data Transformation
        
        '''

        try:
            numerical_columns = ["topic_difficulty","previous_grade"]
            categorical_columns = ["blooms_level"]

            num_pipeline = Pipeline(
                steps = [
                    ("imputer", SimpleImputer()), #If “median”, then replace missing values using the median along each column. Can only be used with numeric data.
                    ("scaler", StandardScaler()) #Standardize features by removing the mean and scaling to unit variance. 
                ]
            )
            cat_pipeline = Pipeline(
                steps=[
                    ("imputer", SimpleImputer(strategy="most_frequent")), # replacing with mode
                    ("one_hot_encoder",OneHotEncoder()), # for category features to be transformed to nxn matrix if u have n categories
                    ("scaler",StandardScaler(with_mean=False)) # category no need to center data
                ]
            )

            #logging.info(f"Categorical Columns: {categorical_columns}")
            logging.info(f"Numerical Columns: {numerical_columns}")
            
            preprocessor = ColumnTransformer(
                [
                    ("num_pipeline", num_pipeline,numerical_columns),
                    ("cat_pipeline",cat_pipeline,categorical_columns)
                ]
            )
            return preprocessor

        except Exception as e:
            raise CustomException(e,sys)

    def initiate_data_transformation(self,train_path,test_path):
        try:
            train_df=pd.read_csv(train_path)
            test_df=pd.read_csv(test_path)

            logging.info("Read train and test data completed")
            logging.info("Obtaining preprocessing object")

            numerical_columns = ["topic_difficulty","previous_grade"]

            for col in numerical_columns:
                # Fill missing values with the median
                train_df[col].fillna(train_df[col].median(), inplace=True)
                test_df[col].fillna(test_df[col].median(), inplace=True)
                train_df[col] = pd.to_numeric(train_df[col], errors='coerce')
                test_df[col] = pd.to_numeric(test_df[col], errors='coerce')

            preprocessing_obj = self.get_data_transformer_object()

            target_column_name = "actual_study_hours"

            # By dropping the target column from the input features, you're isolating the features that the model will learn from.
            input_feature_train_df = train_df.drop(columns=[target_column_name],axis=1) # remove the target
            target_feature_train_df = train_df[target_column_name]

            input_feature_test_df = test_df.drop(columns=[target_column_name],axis=1)
            target_feature_test_df = test_df[target_column_name]

            logging.info(f"Applying preprocesing object on training and testing dataframe")
            
            #scaling normalizing...
            input_feature_train_arr = preprocessing_obj.fit_transform(input_feature_train_df) # # Use fit() to learn the parameters (mean and std dev) from the training data
            input_feature_test_arr = preprocessing_obj.transform(input_feature_test_df) # You should only apply the transformation learned from the training data to the test set, not learn new parameters. This prevents data leakage, where information about the test set inadvertently influences the training of the model, leading to overly optimistic results.	

            train_arr = np.c_[
                input_feature_train_arr,np.array(target_feature_train_df) # concat 
            ]

            test_arr = np.c_[
                input_feature_test_arr,np.array(target_feature_test_df)
            ]

            logging.info(f"Saved preprocessing object")

            save_object(
                file_path =  self.data_transformation_config.preprocessor_obj_file_path,obj=preprocessing_obj
            )

            return(
                train_arr,test_arr, self.data_transformation_config.preprocessor_obj_file_path
            )


        except Exception as e:
            raise CustomException(e,sys)
        
