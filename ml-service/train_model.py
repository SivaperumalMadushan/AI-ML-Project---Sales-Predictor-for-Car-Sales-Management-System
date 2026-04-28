#IT24101555
"""
train_model.py - Train Monthly Sales Prediction Model
"""

from app.model.preprocessor import SalesPreprocessor
from app.model.predictor import SalesPredictor

print(" Starting Monthly Sales Model Training...")

# 1. Load and preprocess data (monthly aggregation)
preprocessor = SalesPreprocessor()
df_monthly = preprocessor.preprocess()

print(f"\n Final Monthly Dataset Shape: {df_monthly.shape}")
print("\nMonthly Sales Statistics:")
print(df_monthly['monthly_units_sold'].describe().round(2))

# 2. Train the model
predictor = SalesPredictor()
metrics = predictor.train(df_monthly)

print("\n🎉 TRAINING COMPLETED SUCCESSFULLY!")
print(f"Forecast Accuracy      : {metrics['forecast_accuracy']:.2f}%")
print(f"Prediction Precision   : {metrics['prediction_precision']:.2f}%")
print(f"Mean Absolute Error    : {metrics['mae']:.2f} units")
print(f"Root Mean Squared Error: {metrics['rmse']:.2f} units")
print(f"R² Score               : {metrics['r2']:.3f}")

print("\nModel has been saved as 'sales_model.pkl' in the model folder.")
print("Model metrics have been saved as 'model_metrics.json'.")