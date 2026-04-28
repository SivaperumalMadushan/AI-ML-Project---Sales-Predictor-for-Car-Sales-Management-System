#IT24102665

"""
depreciation_calculator.py

Calculates vehicle depreciation using car age and mileage.
This creates the True Market Value feature for AI risk prediction.
"""

from datetime import datetime


class VehicleDepreciationCalculator:
    def __init__(self):
        self.current_year = datetime.now().year

    def calculate_car_age(self, manufacture_year):
        manufacture_year = int(manufacture_year)

        if manufacture_year < 1980 or manufacture_year > self.current_year:
            raise ValueError("Invalid manufacture year")

        return self.current_year - manufacture_year

    def calculate_depreciation_rate(self, car_age, mileage_km):
        mileage_km = float(mileage_km)

        if mileage_km < 0:
            raise ValueError("Mileage cannot be negative")

        # Age-based depreciation
        age_depreciation = car_age * 0.06

        # Mileage-based depreciation
        mileage_depreciation = (mileage_km / 100000) * 0.10

        # Total depreciation capped at 80%
        total_depreciation = age_depreciation + mileage_depreciation
        total_depreciation = min(total_depreciation, 0.80)

        return total_depreciation

    def calculate_true_market_value(self, original_price_lkr, manufacture_year, mileage_km):
        original_price_lkr = float(original_price_lkr)

        if original_price_lkr <= 0:
            raise ValueError("Original price must be greater than 0")

        car_age = self.calculate_car_age(manufacture_year)

        depreciation_rate = self.calculate_depreciation_rate(
            car_age,
            mileage_km
        )

        depreciation_amount = original_price_lkr * depreciation_rate
        true_market_value = original_price_lkr - depreciation_amount

        return {
            "car_age": car_age,
            "mileage_km": float(mileage_km),
            "original_price_lkr": round(original_price_lkr, 2),
            "depreciation_rate": round(depreciation_rate, 2),
            "depreciation_percentage": round(depreciation_rate * 100, 2),
            "depreciation_amount_lkr": round(depreciation_amount, 2),
            "true_market_value_lkr": round(true_market_value, 2)
        }