"""Inference service — wraps ML pipeline for API use."""

import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List

from app.config import get_settings

# Add ml module to path
ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(ROOT / "ml"))

from inference import run_full_inference  # noqa: E402


import os
import random
import time

MOCK_INFERENCE = os.getenv("MOCK_INFERENCE", "true").lower() == "true"

class InferenceService:
    def __init__(self):
        settings = get_settings()
        self.output_dir = Path(settings.upload_dir) / "results"
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Run full ML pipeline on a single image."""
        if MOCK_INFERENCE:
            time.sleep(1.5)  # Simulate processing delay
            # Generate realistic dummy metrics based on random
            healthy = random.uniform(40, 90)
            bleached = random.uniform(5, 30)
            dead = random.uniform(0, 15)
            algae = random.uniform(0, 10)
            sand = random.uniform(0, 5)
            total = healthy + bleached + dead + algae + sand
            
            # Normalize to 100%
            factor = 100 / total
            healthy, bleached, dead, algae, sand = [round(x * factor, 2) for x in (healthy, bleached, dead, algae, sand)]
            
            risk_level = "Low"
            if bleached + dead > 30:
                risk_level = "High"
            elif bleached + dead > 15:
                risk_level = "Moderate"

            return {
                "healthy_coral_pct": healthy,
                "bleached_coral_pct": bleached,
                "dead_coral_pct": dead,
                "algae_pct": algae,
                "sand_pct": sand,
                "rock_pct": 0,
                "bleaching_percentage": bleached,
                "risk_level": risk_level,
                "detections": [{"class": "healthy_coral", "confidence": 0.92, "bbox": [10, 10, 100, 100]}],
                "classification": {"predicted_class": "healthy_coral", "confidence": 0.95},
                "diseases": [],
                "percentages": {},
                "annotated_image": image_path, # Provide a dummy annotated image path
                "processed_image": image_path
            }

        result = run_full_inference(image_path, output_dir=str(self.output_dir))
        return result

    def analyze_video(self, video_path: str, frames_dir: str) -> Dict[str, Any]:
        """
        Analyze video by processing extracted frames and aggregating results.
        """
        from app.services.video_processor import extract_frames

        # Extract only 3 frames (start, middle, end) to optimize performance on CPU instances
        frames = extract_frames(video_path, frames_dir, max_frames=3)
        if not frames:
            raise ValueError("No frames extracted from video")

        aggregated = {
            "healthy_coral_pct": 0,
            "bleached_coral_pct": 0,
            "dead_coral_pct": 0,
            "algae_pct": 0,
            "sand_pct": 0,
            "rock_pct": 0,
        }
        all_diseases = []
        all_detections = []
        frame_results = []

        for frame_path in frames:
            result = self.analyze_image(frame_path)
            frame_results.append(result)
            for key in aggregated:
                short_key = key.replace("_pct", "")
                pct_key = f"{short_key}_pct" if not key.endswith("_pct") else key
                # Map result keys
                mapped = {
                    "healthy_coral_pct": "healthy_coral_pct",
                    "bleached_coral_pct": "bleached_coral_pct",
                    "dead_coral_pct": "dead_coral_pct",
                    "algae_pct": "algae_pct",
                    "sand_pct": "sand_pct",
                    "rock_pct": "rock_pct",
                }
                aggregated[key] += result.get(mapped[key], 0)
            all_diseases.extend(result.get("diseases", []))
            all_detections.extend(result.get("detections", []))

        n = len(frames)
        for key in aggregated:
            aggregated[key] = round(aggregated[key] / n, 2)

        from inference import calculate_risk_level
        risk = calculate_risk_level(aggregated)

        # Use middle frame annotated image as representative
        mid_result = frame_results[len(frame_results) // 2]

        return {
            "healthy_coral_pct": aggregated["healthy_coral_pct"],
            "bleached_coral_pct": aggregated["bleached_coral_pct"],
            "dead_coral_pct": aggregated["dead_coral_pct"],
            "algae_pct": aggregated["algae_pct"],
            "sand_pct": aggregated["sand_pct"],
            "rock_pct": aggregated["rock_pct"],
            "bleaching_percentage": aggregated["bleached_coral_pct"],
            "risk_level": risk,
            "diseases": all_diseases[:10],
            "detections": all_detections[:20],
            "classification": mid_result.get("classification", {}),
            "annotated_image": mid_result.get("annotated_image"),
            "frames_analyzed": n,
        }


inference_service = InferenceService()
