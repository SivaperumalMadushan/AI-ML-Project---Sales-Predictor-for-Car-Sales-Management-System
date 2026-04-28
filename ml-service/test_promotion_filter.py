from app.model.promotion_filter import PromotionFilter

promotion_filter = PromotionFilter(threshold=0.5)

print("Testing promotional offer threshold rules...")

vehicles = [
    {
        "vehicle_id": "CAR001",
        "model_name": "Toyota Aqua",
        "score": 0.32
    },
    {
        "vehicle_id": "CAR002",
        "model_name": "Honda Civic",
        "score": 0.72
    },
    {
        "vehicle_id": "CAR003",
        "model_name": "Suzuki Wagon R",
        "score": 0.45
    },
    {
        "vehicle_id": "CAR004",
        "model_name": "Toyota Premio",
        "score": 0.88
    }
]

print("\nAll Vehicle Scores:")
for vehicle in vehicles:
    result = promotion_filter.check_promotion_eligibility(vehicle)
    print(result)

promotional_vehicles = promotion_filter.filter_promotional_vehicles(vehicles)

print("\nVehicles Selected for Promotional Offers:")
for vehicle in promotional_vehicles:
    print(vehicle)

print("\nPromotion threshold filtering completed successfully.")