# IT24100567

from app.model.input_cleaner import UserInputCleaner

cleaner = UserInputCleaner()

print("Testing sales input cleaning...")

raw_input = {
    "sale_id": "1",
    "sale_date": "12/04/2025",
    "year": "2025",
    "month": "4",
    "quarter": "2",

    "brand": " toyota ",
    "model": " prius ",
    "vehicle_type": " sedan ",
    "fuel_type": " hybrid ",
    "transmission": " auto ",
    "condition": " recondi ",
    "branch_location": " colombo ",

    "units_sold": "4",
    "avg_selling_price_lkr": "LKR 8,500,000",
    "discount_percentage": "5%",
    "revenue_lkr": "",

    "is_festive_month": "1",
    "is_promotion_month": "0",
    "stock_available": "32",
    "booking_count": "28",
    "fuel_price_index": "128.39",
    "market_shock_flag": "0"
}

cleaned_input = cleaner.clean_input(raw_input)

print("\nRaw Sales Input:")
print(raw_input)

print("\nCleaned Sales Input:")
print(cleaned_input)

print("\nSales input cleaning completed successfully.")