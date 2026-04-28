import sys
from pathlib import Path

# Add the correct path so Python can find the model folder
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR / "app"))

from model.preprocessor import SalesPreprocessor

# ====================== Test Code ======================
print(" Starting test...")

preprocessor = SalesPreprocessor()

# Load and preprocess from CSV
df = preprocessor.preprocess(
    from_csv=True, 
    csv_filename="sales_dataset.csv"
)

print("\n SUCCESS! Preprocessing completed.")
print(f"Final DataFrame shape: {df.shape} rows × {df.shape[1]} columns")
print("\nColumn names:", df.columns.tolist())

print("\nFirst 3 rows:")
print(df.head(3))

print("\n--- Basic Statistics ---")
print(df.describe().round(2))

log = preprocessor.get_validation_log()
if log:
    print("\nValidation Issues:")
    for item in log:
        print("•", item)
else:
    print("\n No validation issues!")