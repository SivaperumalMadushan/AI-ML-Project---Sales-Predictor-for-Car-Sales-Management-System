import pandas as pd
from pathlib import Path

# Paths
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

INPUT_FILE = DATA_DIR / "sales_dataset.csv"

CLEANED_FILE = DATA_DIR / "cleaned_sales_dataset.csv"
FEATURED_FILE = DATA_DIR / "featured_sales_dataset.csv"

# 1. Load dataset
df = pd.read_csv(INPUT_FILE)

print("Original dataset shape:", df.shape)

# 2. Standardize column names
df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

# 3. Fix date format
df["sale_date"] = pd.to_datetime(df["sale_date"], errors="coerce")

# Remove invalid date rows
df = df.dropna(subset=["sale_date"])

# 4. Remove duplicate rows
df = df.drop_duplicates()

# 5. Clean text columns
text_columns = [
    "brand",
    "model",
    "vehicle_type",
    "fuel_type",
    "transmission",
    "condition",
    "branch_location"
]

for col in text_columns:
    if col in df.columns:
        df[col] = df[col].astype(str).str.strip().str.title()

# 6. Convert numeric columns
numeric_columns = [
    "units_sold",
    "avg_selling_price_lkr",
    "discount_percentage",
    "revenue_lkr",
    "stock_available",
    "booking_count",
    "fuel_price_index"
]

for col in numeric_columns:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

# 7. Fill missing numeric values
for col in numeric_columns:
    if col in df.columns:
        df[col] = df[col].fillna(df[col].median())

# 8. Remove negative invalid values
for col in numeric_columns:
    if col in df.columns:
        df = df[df[col] >= 0]

# 9. Fix binary columns
binary_columns = [
    "is_festive_month",
    "is_promotion_month",
    "market_shock_flag"
]

for col in binary_columns:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)
        df[col] = df[col].apply(lambda x: 1 if x == 1 else 0)

# 10. Recreate date columns
df["year"] = df["sale_date"].dt.year
df["month"] = df["sale_date"].dt.month
df["quarter"] = df["sale_date"].dt.quarter

# 11. Sort by date
df = df.sort_values(by="sale_date").reset_index(drop=True)

# 12. Save cleaned dataset
df.to_csv(CLEANED_FILE, index=False)

print("Cleaned dataset saved:", CLEANED_FILE)
print("Cleaned dataset shape:", df.shape)

# ============================
# Feature Engineering
# ============================

featured_df = df.copy()

# Date features
featured_df["day_of_week"] = featured_df["sale_date"].dt.day_name()
featured_df["day_of_week_number"] = featured_df["sale_date"].dt.dayofweek
featured_df["is_weekend"] = featured_df["day_of_week_number"].apply(lambda x: 1 if x >= 5 else 0)

# Rolling sales features by brand and model
featured_df["rolling_7_day_avg_sales"] = (
    featured_df.groupby(["brand", "model"])["units_sold"]
    .transform(lambda x: x.rolling(window=7, min_periods=1).mean())
)

featured_df["rolling_30_day_avg_sales"] = (
    featured_df.groupby(["brand", "model"])["units_sold"]
    .transform(lambda x: x.rolling(window=30, min_periods=1).mean())
)

# Demand level
def get_demand_level(units):
    if units >= 8:
        return "High"
    elif units >= 4:
        return "Medium"
    else:
        return "Low"

featured_df["demand_level"] = featured_df["units_sold"].apply(get_demand_level)

# Stock status
def get_stock_status(row):
    if row["stock_available"] <= row["units_sold"]:
        return "Low Stock"
    elif row["stock_available"] > row["units_sold"] * 3:
        return "Overstock"
    else:
        return "Enough Stock"

featured_df["stock_status"] = featured_df.apply(get_stock_status, axis=1)

# Encoded values
featured_df["demand_level_encoded"] = featured_df["demand_level"].map({
    "Low": 0,
    "Medium": 1,
    "High": 2
})

featured_df["stock_status_encoded"] = featured_df["stock_status"].map({
    "Low Stock": 0,
    "Enough Stock": 1,
    "Overstock": 2
})

# Save featured dataset
featured_df.to_csv(FEATURED_FILE, index=False)

print("Featured dataset saved:", FEATURED_FILE)
print("Featured dataset shape:", featured_df.shape)

print("\nGenerated proof files:")
print("1.", CLEANED_FILE)
print("2.", FEATURED_FILE)