#IT24101555
"""
============================================================
main.py — Car Hub ML Forecasting Service (Fixed)
============================================================
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.model.predictor import SalesPredictor


# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


# FastAPI App
app = FastAPI(
    title="Car Hub ML Forecasting Service",
    description="AI-powered Monthly Vehicle Sales Forecasting",
    version="1.0.0"
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Predictor Object
predictor = SalesPredictor()


# Request / Response Models
class PredictionRequest(BaseModel):
    months_ahead: int = Field(default=3, ge=1, le=24)


class PredictionResponse(BaseModel):
    success: bool
    message: str
    predictions: List[Dict[str, Any]]
    summary: Dict[str, Any]
    generated_at: str


# Root Endpoint
@app.get("/")
async def root():
    return {
        "service": "Car Hub Sales Forecasting API",
        "status": "running"
    }


# Health Check Endpoint
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": predictor.model is not None
    }


# Metrics Endpoint
@app.get("/metrics")
async def get_model_metrics():
    try:
        metrics_path = Path(__file__).parent / "model" / "model_metrics.json"

        if not metrics_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Model metrics not found. Please train the model first."
            )

        with open(metrics_path, "r") as file:
            metrics = json.load(file)

        return {
            "success": True,
            "message": "Model metrics loaded successfully",
            "metrics": metrics
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Metrics loading error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Prediction Endpoint
@app.post("/predict", response_model=PredictionResponse)
async def predict_sales(request: PredictionRequest):
    try:
        logger.info(
            f"Prediction request received: {request.months_ahead} months ahead"
        )

        if predictor.model is None:
            loaded = predictor.load_model()

            if not loaded:
                raise HTTPException(
                    status_code=404,
                    detail="Model not found. Please run train_model.py first."
                )

        predictions = predictor.predict(months_ahead=request.months_ahead)

        total_units = sum(
            p.get("predicted_units", 0) for p in predictions
        )

        return PredictionResponse(
            success=True,
            message=f"Successfully predicted next {request.months_ahead} months",
            predictions=predictions,
            summary={
                "total_predicted_units": round(total_units, 1),
                "average_monthly": round(total_units / len(predictions), 1)
                if predictions else 0,
                "period": f"Next {request.months_ahead} months"
            },
            generated_at=datetime.utcnow().isoformat()
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Startup Event
@app.on_event("startup")
async def startup_event():
    try:
        loaded = predictor.load_model()

        if loaded:
            logger.info("✅ Sales model loaded successfully on startup")
        else:
            logger.warning("⚠️ Model not found. Please run train_model.py first.")

    except Exception as e:
        logger.warning(f"⚠️ Model loading failed: {e}")


# Local Run
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )