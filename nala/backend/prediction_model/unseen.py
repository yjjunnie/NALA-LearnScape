import pandas as pd
from src.utils import load_object
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# test 

unseen_data_path = "/Users/yvonne/User Github/NALA-LearnScape/nala/backend/prediction_model/Notebook/data/unseen_data.csv"

unseen_df = pd.read_csv(unseen_data_path)

preprocessor = load_object("/Users/yvonne/User Github/NALA-LearnScape/nala/backend/prediction_model/artifacts/preprocessor.pkl")

target_column_name = "actual_study_hours"
if target_column_name in unseen_df.columns:
    unseen_target = unseen_df[target_column_name]
    unseen_features = unseen_df.drop(columns=[target_column_name], axis=1)
else:
    unseen_features = unseen_df

unseen_features_transformed = preprocessor.transform(unseen_features)

model = load_object("/Users/yvonne/User Github/NALA-LearnScape/nala/backend/prediction_model/artifacts/model.pkl")

unseen_predictions = model.predict(unseen_features_transformed)

if target_column_name in unseen_df.columns:
    r2 = r2_score(unseen_target, unseen_predictions)
    mae = mean_absolute_error(unseen_target, unseen_predictions)
    mse = mean_squared_error(unseen_target, unseen_predictions)
    rmse = mse ** 0.5
    print(f"Unseen Data R²: {r2}")
    print(f"Unseen Data Mean Absolute Error: {mae}")
    print(f"Unseen Data Root Mean Squared Error: {rmse}")
    print(unseen_predictions)

else:
    print("Predictions on unseen data:")
    print(unseen_predictions)