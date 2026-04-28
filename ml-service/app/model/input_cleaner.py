# IT24100567
"""
input_cleaner.py

Cleans and formats raw sales input records before sending data
to the sales forecasting AI/ML pipeline.

This cleaner matches the Car Hub sales dataset fields.
"""

from datetime import datetime


class UserInputCleaner:
    """
    Cleans raw sales data fields used by the monthly sales forecasting model.
    """

    def __init__(self):
        self.valid_binary_values = {0, 1}

    # -----------------------------------------------------
    # BASIC CLEANING HELPERS
    # -----------------------------------------------------

    def clean_text(self, value, default="Unknown"):
        """
        Clean text fields such as brand, model, vehicle type, fuel type, etc.
        """

        if value is None:
            return default

        value = str(value).strip()

        if value == "" or value.lower() in ["nan", "none", "null"]:
            return default

        return value.title()

    def clean_vehicle_type(self, value):
        """
        Clean vehicle type while keeping common acronyms such as SUV.
        """

        value = self.clean_text(value)

        mapping = {
            "Suv": "SUV",
            "MpV": "MPV",
            "Mpv": "MPV"
        }

        return mapping.get(value, value)

    def clean_numeric(self, value, default=0.0):
        """
        Convert numeric strings into float.

        Handles:
        Rs. 8,500,000
        LKR 8,500,000
        5%
        1E+07
        """

        if value is None:
            return default

        try:
            value = (
                str(value)
                .replace("Rs.", "")
                .replace("Rs", "")
                .replace("LKR", "")
                .replace(",", "")
                .replace("%", "")
                .strip()
            )

            if value == "" or value.lower() in ["nan", "none", "null"]:
                return default

            return float(value)

        except ValueError:
            return default

    def clean_integer(self, value, default=0):
        """
        Convert values into safe integer.
        """

        try:
            return int(round(self.clean_numeric(value, default)))
        except ValueError:
            return default

    def clean_binary(self, value, default=0):
        """
        Convert binary flag values into 0 or 1.
        """

        value = self.clean_integer(value, default)

        if value == 1:
            return 1

        return 0

    def clean_discount_percentage(self, value):
        """
        Clean discount percentage and keep it between 0 and 100.
        """

        discount = self.clean_numeric(value, 0.0)

        if discount < 0:
            discount = 0.0

        if discount > 100:
            discount = 100.0

        return round(discount, 2)

    def clean_positive_number(self, value, default=0.0):
        """
        Clean numeric fields that should not be negative.
        """

        number = self.clean_numeric(value, default)

        if number < 0:
            return default

        return number

    def clean_units_sold(self, value):
        """
        Clean units_sold value.

        If units_sold is missing or negative, convert it to 0.
        """

        units = self.clean_integer(value, 0)

        if units < 0:
            return 0

        return units

    def clean_sale_date(self, value):
        """
        Clean sale_date and convert it into YYYY-MM-DD format.

        Supports:
        2025-04-12
        12/04/2025
        12-04-2025
        """

        if value is None:
            return None

        value = str(value).strip()

        if value == "" or value.lower() in ["nan", "none", "null"]:
            return None

        possible_formats = [
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%m/%d/%Y",
            "%m-%d-%Y"
        ]

        for date_format in possible_formats:
            try:
                parsed_date = datetime.strptime(value, date_format)
                return parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                continue

        return None

    def calculate_time_fields(self, sale_date, year=None, month=None, quarter=None):
        """
        Calculate year, month, and quarter using sale_date if possible.
        If sale_date is invalid, fallback to existing year/month/quarter.
        """

        if sale_date:
            parsed_date = datetime.strptime(sale_date, "%Y-%m-%d")

            clean_year = parsed_date.year
            clean_month = parsed_date.month
            clean_quarter = ((clean_month - 1) // 3) + 1

            return clean_year, clean_month, clean_quarter

        clean_year = self.clean_integer(year, 0)
        clean_month = self.clean_integer(month, 0)
        clean_quarter = self.clean_integer(quarter, 0)

        return clean_year, clean_month, clean_quarter

    # -----------------------------------------------------
    # MAIN CLEANING FUNCTION
    # -----------------------------------------------------

    def clean_input(self, raw_input):
        """
        Clean one complete sales record.
        """

        sale_date = self.clean_sale_date(raw_input.get("sale_date"))

        year, month, quarter = self.calculate_time_fields(
            sale_date=sale_date,
            year=raw_input.get("year"),
            month=raw_input.get("month"),
            quarter=raw_input.get("quarter")
        )

        avg_selling_price = self.clean_positive_number(
            raw_input.get("avg_selling_price_lkr", raw_input.get("avg_sell")),
            0.0
        )

        discount_percentage = self.clean_discount_percentage(
            raw_input.get("discount_percentage", raw_input.get("discount"))
        )

        units_sold = self.clean_units_sold(
            raw_input.get("units_sold")
        )

        revenue_lkr = self.clean_positive_number(
            raw_input.get("revenue_lkr"),
            0.0
        )

        # If revenue is missing, calculate it
        if revenue_lkr == 0 and avg_selling_price > 0 and units_sold > 0:
            revenue_lkr = (
                avg_selling_price
                * units_sold
                * (1 - discount_percentage / 100)
            )

        cleaned_data = {
            "sale_id": self.clean_integer(raw_input.get("sale_id"), 0),
            "sale_date": sale_date,
            "year": year,
            "month": month,
            "quarter": quarter,

            "brand": self.clean_text(raw_input.get("brand")),
            "model": self.clean_text(raw_input.get("model")),
            "vehicle_type": self.clean_vehicle_type(raw_input.get("vehicle_type")),
            "fuel_type": self.clean_text(raw_input.get("fuel_type")),
            "transmission": self.clean_text(raw_input.get("transmission")),
            "condition": self.clean_text(raw_input.get("condition")),
            "branch_location": self.clean_text(raw_input.get("branch_location")),

            "units_sold": units_sold,
            "avg_selling_price_lkr": round(avg_selling_price, 2),
            "discount_percentage": discount_percentage,
            "revenue_lkr": round(revenue_lkr, 2),

            "is_festive_month": self.clean_binary(
                raw_input.get("is_festive_month")
            ),
            "is_promotion_month": self.clean_binary(
                raw_input.get("is_promotion_month")
            ),
            "stock_available": self.clean_positive_number(
                raw_input.get("stock_available"),
                0.0
            ),
            "booking_count": self.clean_positive_number(
                raw_input.get("booking_count"),
                0.0
            ),
            "fuel_price_index": self.clean_positive_number(
                raw_input.get("fuel_price_index"),
                0.0
            ),
            "market_shock_flag": self.clean_binary(
                raw_input.get("market_shock_flag")
            )
        }

        return cleaned_data