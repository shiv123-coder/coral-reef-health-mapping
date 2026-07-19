"""
inference.py — Unified inference pipeline for production use.

Combines YOLO detection + DeepLabV3+ segmentation + EfficientNet classification
using ONNXRuntime for blazingly fast CPU execution.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

import cv2
import numpy as np
from PIL import Image
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env.production")

BASE_DIR = Path(__file__).parent
WEIGHTS_DIR = BASE_DIR / "weights"
CONF_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.65"))

CLASSES = ["healthy_coral", "bleached_coral", "dead_coral", "algae", "sand", "rock"]
CLASS_COLORS = {
    "healthy_coral": (0, 200, 100),
    "bleached_coral": (255, 255, 200),
    "dead_coral": (128, 128, 128),
    "algae": (0, 180, 0),
    "sand": (210, 180, 140),
    "rock": (100, 100, 100),
}

# Lazy-loaded models
_yolo_model = None
_seg_model = None
_cls_model = None
_cls_names = CLASSES


def _load_yolo():
    global _yolo_model
    if _yolo_model is None:
        from ultralytics import YOLO
        path = WEIGHTS_DIR / "yolo_best.onnx"
        if not path.exists():
            path = WEIGHTS_DIR / "yolo_best.pt"
            if not path.exists():
                path = "yolo11n.pt"
        _yolo_model = YOLO(str(path), task='detect')
    return _yolo_model


def _load_segmentation():
    global _seg_model
    if _seg_model is None:
        onnx_path = WEIGHTS_DIR / "deeplabv3_best.onnx"
        if onnx_path.exists():
            import onnxruntime as ort
            _seg_model = ort.InferenceSession(str(onnx_path), providers=['CPUExecutionProvider'])
            _seg_model.is_onnx = True
        else:
            # Fallback to PyTorch
            import torch
            from torchvision.models.segmentation import deeplabv3_resnet50
            if not torch.cuda.is_available():
                torch.set_num_threads(1)
            path = WEIGHTS_DIR / "deeplabv3_best.pth"
            num_classes = len(CLASSES) + 1
            _seg_model = deeplabv3_resnet50(weights=None, num_classes=num_classes)
            if path.exists():
                _seg_model.load_state_dict(torch.load(path, map_location="cpu", weights_only=True), strict=False)
            _seg_model = _seg_model.to("cpu").eval()
            _seg_model.is_onnx = False
    return _seg_model


def _load_classifier():
    global _cls_model
    if _cls_model is None:
        onnx_path = WEIGHTS_DIR / "efficientnet_best.onnx"
        if onnx_path.exists():
            import onnxruntime as ort
            _cls_model = ort.InferenceSession(str(onnx_path), providers=['CPUExecutionProvider'])
            _cls_model.is_onnx = True
        else:
            # Fallback to PyTorch
            import torch
            import torch.nn as nn
            from torchvision import models
            if not torch.cuda.is_available():
                torch.set_num_threads(1)
            path = WEIGHTS_DIR / "efficientnet_best.pth"
            if path.exists():
                ckpt = torch.load(path, map_location="cpu", weights_only=False)
                num_classes = ckpt.get("num_classes", len(CLASSES))
                _cls_model = models.efficientnet_b0(weights=None)
                _cls_model.classifier[1] = nn.Linear(_cls_model.classifier[1].in_features, num_classes)
                _cls_model.load_state_dict(ckpt["model_state_dict"])
            else:
                _cls_model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
                _cls_model.classifier[1] = nn.Linear(_cls_model.classifier[1].in_features, len(CLASSES))
            _cls_model = _cls_model.to("cpu").eval()
            _cls_model.is_onnx = False
    return _cls_model


def preprocess_image(image: np.ndarray) -> np.ndarray:
    """Underwater image preprocessing: denoise, color correction, contrast."""
    denoised = cv2.bilateralFilter(image, 9, 75, 75)
    b, g, r = cv2.split(denoised.astype(np.float32))
    r = np.clip(r * 1.3, 0, 255)
    g = np.clip(g * 1.1, 0, 255)
    corrected = cv2.merge([b, g, r]).astype(np.uint8)
    lab = cv2.cvtColor(corrected, cv2.COLOR_BGR2LAB)
    l, a, b_ch = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.cvtColor(cv2.merge([l, a, b_ch]), cv2.COLOR_LAB2BGR)
    return enhanced


def run_detection(image: np.ndarray) -> list:
    """YOLO object detection."""
    model = _load_yolo()
    results = model(image, conf=CONF_THRESHOLD, verbose=False)
    detections = []
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            # YOLO results are in CPU memory regardless of ONNX
            xyxy = box.xyxy[0].cpu().numpy().tolist() if hasattr(box.xyxy[0], 'cpu') else box.xyxy[0].tolist()
            name = CLASSES[cls_id] if cls_id < len(CLASSES) else "unknown"
            detections.append({"class": name, "confidence": conf, "bbox": xyxy})
    return detections


def run_segmentation(image: np.ndarray) -> Tuple[np.ndarray, Dict[str, float]]:
    """DeepLabV3+ semantic segmentation."""
    model = _load_segmentation()
    h, w = image.shape[:2]

    # Preprocessing
    image_resized = cv2.resize(image, (256, 256))
    image_rgb = cv2.cvtColor(image_resized, cv2.COLOR_BGR2RGB)
    
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    
    tensor = (image_rgb.astype(np.float32) / 255.0 - mean) / std
    tensor = tensor.transpose(2, 0, 1)
    tensor = np.expand_dims(tensor, 0) # Shape: (1, 3, 256, 256)

    if getattr(model, 'is_onnx', False):
        input_name = model.get_inputs()[0].name
        out = model.run(None, {input_name: tensor})[0]
        mask = np.argmax(out, axis=1).squeeze(0)
    else:
        import torch
        t_in = torch.from_numpy(tensor).to("cpu")
        with torch.no_grad():
            out = model(t_in)["out"]
            mask = out.argmax(dim=1).squeeze().numpy()

    mask = cv2.resize(mask.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)

    total_pixels = h * w
    percentages = {}
    for i, cls in enumerate(CLASSES):
        cls_pixels = np.sum(mask == (i + 1))
        percentages[cls] = round(100.0 * cls_pixels / total_pixels, 2)

    return mask, percentages


def run_classification(image: np.ndarray) -> Dict[str, Any]:
    """EfficientNet image-level classification."""
    model = _load_classifier()
    class_names = _cls_names
    
    image_resized = cv2.resize(image, (224, 224))
    image_rgb = cv2.cvtColor(image_resized, cv2.COLOR_BGR2RGB)
    
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    
    tensor = (image_rgb.astype(np.float32) / 255.0 - mean) / std
    tensor = tensor.transpose(2, 0, 1)
    tensor = np.expand_dims(tensor, 0)
    
    if getattr(model, 'is_onnx', False):
        input_name = model.get_inputs()[0].name
        outputs = model.run(None, {input_name: tensor})[0]
        logits = outputs[0]
    else:
        import torch
        t_in = torch.from_numpy(tensor).to("cpu")
        with torch.no_grad():
            logits = model(t_in)[0].numpy()
            
    # Softmax
    exp_scores = np.exp(logits - np.max(logits))
    probs = exp_scores / np.sum(exp_scores)
    
    top_idx = int(np.argmax(probs))
    return {
        "predicted_class": class_names[top_idx],
        "confidence": round(float(probs[top_idx]), 4),
        "all_probs": {class_names[i]: round(float(probs[i]), 4) for i in range(len(class_names))},
    }


def calculate_risk_level(percentages: Dict[str, float]) -> str:
    """Determine reef health risk level from class percentages."""
    bleached = percentages.get("bleached_coral", 0)
    dead = percentages.get("dead_coral", 0)
    algae = percentages.get("algae", 0)
    healthy = percentages.get("healthy_coral", 0)

    stress_score = bleached * 1.5 + dead * 2.0 + algae * 0.8 - healthy * 0.5

    if stress_score >= 40:
        return "Critical"
    elif stress_score >= 25:
        return "High"
    elif stress_score >= 12:
        return "Moderate"
    elif stress_score >= 5:
        return "Low"
    return "Minimal"


def detect_disease(image: np.ndarray, mask: np.ndarray) -> list:
    """Heuristic disease detection based on color anomalies in coral regions."""
    diseases = []
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # White patch detection
    white_mask = cv2.inRange(hsv, (0, 0, 180), (180, 40, 255))
    coral_region = mask > 0
    white_in_coral = np.sum(white_mask[coral_region] > 0)
    coral_pixels = max(np.sum(coral_region), 1)
    white_ratio = white_in_coral / coral_pixels

    if white_ratio > 0.15:
        diseases.append({
            "type": "White Patch Syndrome",
            "severity": "High" if white_ratio > 0.3 else "Moderate",
            "affected_percent": round(white_ratio * 100, 2),
        })

    # Dark spot detection
    dark_mask = cv2.inRange(hsv, (0, 0, 0), (180, 255, 60))
    dark_in_coral = np.sum(dark_mask[coral_region] > 0)
    dark_ratio = dark_in_coral / coral_pixels

    if dark_ratio > 0.1:
        diseases.append({
            "type": "Dark Spot Disease",
            "severity": "Moderate" if dark_ratio > 0.2 else "Low",
            "affected_percent": round(dark_ratio * 100, 2),
        })

    return diseases


def annotate_image(image: np.ndarray, mask: np.ndarray, detections: list) -> np.ndarray:
    """Draw segmentation overlay and detection boxes."""
    annotated = image.copy()
    overlay = annotated.copy()

    for i, cls in enumerate(CLASSES):
        cls_mask = mask == (i + 1)
        if np.any(cls_mask):
            color = CLASS_COLORS.get(cls, (255, 255, 255))
            overlay[cls_mask] = color

    annotated = cv2.addWeighted(overlay, 0.4, annotated, 0.6, 0)

    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
        color = CLASS_COLORS.get(det["class"], (255, 255, 255))
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        label = f"{det['class']} {det['confidence']:.2f}"
        cv2.putText(annotated, label, (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    return annotated


def run_full_inference(image_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Full inference pipeline on a single image.
    Returns dict with percentages, risk, detections, diseases, classification, paths.
    """
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Cannot read image: {image_path}")

    processed = preprocess_image(image)
    detections = run_detection(processed)
    mask, percentages = run_segmentation(processed)
    classification = run_classification(processed)
    diseases = detect_disease(processed, mask)
    risk_level = calculate_risk_level(percentages)
    annotated = annotate_image(processed, mask, detections)

    bleaching_pct = percentages.get("bleached_coral", 0)

    result = {
        "healthy_coral_pct": percentages.get("healthy_coral", 0),
        "bleached_coral_pct": bleaching_pct,
        "dead_coral_pct": percentages.get("dead_coral", 0),
        "algae_pct": percentages.get("algae", 0),
        "sand_pct": percentages.get("sand", 0),
        "rock_pct": percentages.get("rock", 0),
        "bleaching_percentage": bleaching_pct,
        "risk_level": risk_level,
        "detections": detections,
        "classification": classification,
        "diseases": diseases,
        "percentages": percentages,
    }

    if output_dir:
        out = Path(output_dir)
        out.mkdir(parents=True, exist_ok=True)
        stem = Path(image_path).stem
        ann_path = out / f"{stem}_annotated.jpg"
        proc_path = out / f"{stem}_processed.jpg"
        cv2.imwrite(str(ann_path), annotated)
        cv2.imwrite(str(proc_path), processed)
        result["annotated_image"] = str(ann_path)
        result["processed_image"] = str(proc_path)

    return result


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python inference.py <image_path>")
        sys.exit(1)
    result = run_full_inference(sys.argv[1], output_dir="output")
    print(json.dumps(result, indent=2))
