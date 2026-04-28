#IT24104206

"""
promotion_filter.py

Applies threshold rules to AI model output score.
If the score is below 0.5, the vehicle is selected for promotional offers.
"""


class PromotionFilter:
    def __init__(self, threshold=0.5):
        self.threshold = threshold

    def check_promotion_eligibility(self, vehicle_data):
        """
        Checks whether a vehicle should receive a promotional offer.
        """

        score = float(vehicle_data.get("score", 0))

        if score < self.threshold:
            promotion_status = "Eligible for Promotion"
            reason = "Score is below threshold, so promotional offer is recommended."
        else:
            promotion_status = "Not Eligible for Promotion"
            reason = "Score is above threshold, so promotion is not required."

        return {
            "vehicle_id": vehicle_data.get("vehicle_id"),
            "model_name": vehicle_data.get("model_name"),
            "score": score,
            "threshold": self.threshold,
            "promotion_status": promotion_status,
            "reason": reason
        }

    def filter_promotional_vehicles(self, vehicles):
        """
        Filters only vehicles eligible for promotion.
        """

        results = []

        for vehicle in vehicles:
            result = self.check_promotion_eligibility(vehicle)

            if result["score"] < self.threshold:
                results.append(result)

        return results