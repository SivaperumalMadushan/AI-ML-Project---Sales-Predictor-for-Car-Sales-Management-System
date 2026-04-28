"""
============================================================
preprocessor.py — Monthly Sales Preprocessing (Final Version)
- Aggregates daily sales to monthly
- Adds important time series features (lags, rolling, trend)
============================================================
"""

import pandas as pd
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class SalesPreprocessor:
    """
    Preprocesses raw daily sales data and converts it to monthly level for forecasting.
    """

    def __init__(self):
        self.validation_log = []
        logger.info("SalesPreprocessor initialized")

    def load_from_csv(self, filename: str = "sales_dataset.csv") -> pd.DataFrame:
        """Load dataset from ml-service/data/ folder"""
        base_dir = Path(__file__).resolve().parent.parent.parent
        data_path = base_dir / "data" / filename
        
        logger.info(f"Loading CSV from: {data_path}")
        if not data_path.exists():
            raise FileNotFoundError(f"Dataset not found: {data_path}")
        
        df = pd.read_csv(data_path)
        logger.info(f" Raw data loaded: {df.shape}")
        return df

    def preprocess(self, raw_records=None, from_csv=True, csv_filename="sales_dataset.csv") -> pd.DataFrame:
        """Main preprocessing pipeline - returns monthly data"""
        logger.info("Starting monthly preprocessing with time series features...")

        if from_csv:
            df = self.load_from_csv(csv_filename)
        else:
            df = pd.DataFrame(raw_records)

        # Clean target column
        if 'units_sold' in df.columns:
            df['units_sold'] = df['units_sold'].replace(-1, 0).astype(int)

        # Parse sale date (handles dd/mm/yyyy format)
        date_col = None
        for col in ['sale_date', 'date', 'saleDate']:
            if col in df.columns:
                date_col = col
                break

        if date_col:
            df['sale_date'] = pd.to_datetime(df[date_col], dayfirst=True, errors='coerce')
        df = df.dropna(subset=['sale_date'])

        # Convert possible string numeric columns
        numeric_cols = ['discount_percentage', 'stock_available', 'booking_count',
                       'fuel_price_index', 'market_shock_flag', 'is_festive_month',
                       'is_promotion_month']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # === AGGREGATE TO MONTHLY LEVEL ===
        df['month'] = df['sale_date'].dt.to_period('M')

        monthly = df.groupby('month').agg({
            'units_sold': 'sum',                    # Target: Monthly total units sold
            'sale_date': 'first',
            'discount_percentage': 'mean',
            'stock_available': 'mean',
            'booking_count': 'mean',
            'fuel_price_index': 'mean',
            'market_shock_flag': 'max',
            'is_festive_month': 'max',
            'is_promotion_month': 'max',
            'brand': lambda x: x.mode().iloc[0] if not x.empty else 'Unknown',
            'vehicle_type': lambda x: x.mode().iloc[0] if not x.empty else 'Unknown',
        }).reset_index()

        monthly.rename(columns={'units_sold': 'monthly_units_sold'}, inplace=True)

        # Time-based features
        monthly = monthly.sort_values('sale_date')
        monthly['sale_year'] = monthly['sale_date'].dt.year
        monthly['sale_month'] = monthly['sale_date'].dt.month
        monthly['sale_quarter'] = monthly['sale_date'].dt.quarter
        monthly['is_end_of_year'] = (monthly['sale_month'] == 12).astype(int)

        # === Time Series Features (Very Important for Sales Prediction) ===
        monthly['lag_1'] = monthly['monthly_units_sold'].shift(1)      # Previous month
        monthly['lag_3'] = monthly['monthly_units_sold'].shift(3)
        monthly['lag_12'] = monthly['monthly_units_sold'].shift(12)    # Same month last year
        monthly['rolling_mean_3'] = monthly['monthly_units_sold'].rolling(window=3).mean()
        monthly['rolling_mean_6'] = monthly['monthly_units_sold'].rolling(window=6).mean()
        monthly['trend'] = range(len(monthly))                         # Overall trend

        # Drop rows with NaN (due to lag features)
        monthly = monthly.dropna().reset_index(drop=True)

        logger.info(f" Monthly dataset created successfully! Shape: {monthly.shape}")
        logger.info(f"Monthly Sales Statistics:\n{monthly['monthly_units_sold'].describe()}")

        return monthly

    def get_validation_log(self) -> list:
        return self.validation_log