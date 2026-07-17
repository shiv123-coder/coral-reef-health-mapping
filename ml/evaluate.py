"""
evaluate.py — Model evaluation metrics.

Generates:
  - Confusion Matrix (classification)
  - Precision, Recall, F1-score per class
  - IoU (segmentation)
  - mAP (detection via YOLO validation)
  - Saves plots to ml/weights/evaluation/
"""

import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import torch
import torch.nn as nn
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env.production")

BASE_DIR = Path(__file__).parent
WEIGHTS_DIR = BASE_DIR / "weights"
EVAL_DIR = WEIGHTS_DIR / "evaluation"
EVAL_DIR.mkdir(parents=True, exist_ok=True)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLASSES = ["healthy_coral", "bleached_coral", "dead_coral", "algae", "sand", "rock"]


def evaluate_classifier():
    """Evaluate EfficientNet classifier."""
    print("\n📊 Evaluating Classifier...")
    ckpt_path = WEIGHTS_DIR / "efficientnet_best.pth"
    if not ckpt_path.exists():
        print("  ⚠ Classifier weights not found")
        return {}

    from torchvision import models

    ckpt = torch.load(ckpt_path, map_location=DEVICE, weights_only=False)
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, ckpt["num_classes"])
    model.load_state_dict(ckpt["model_state_dict"])
    model = model.to(DEVICE).eval()

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    val_dir = BASE_DIR / "data" / "classification" / "val"
    if not val_dir.exists():
        return {}

    val_ds = datasets.ImageFolder(str(val_dir), transform=transform)
    loader = DataLoader(val_ds, batch_size=8, shuffle=False)

    all_preds, all_labels = [], []
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(DEVICE)
            outputs = model(images)
            _, preds = outputs.max(1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())

    report = classification_report(all_labels, all_preds, target_names=val_ds.classes, output_dict=True)
    cm = confusion_matrix(all_labels, all_preds)

    # Plot confusion matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", xticklabels=val_ds.classes, yticklabels=val_ds.classes, cmap="Blues")
    plt.title("Classification Confusion Matrix")
    plt.ylabel("True")
    plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig(EVAL_DIR / "confusion_matrix.png", dpi=150)
    plt.close()

    f1 = f1_score(all_labels, all_preds, average="weighted")
    print(f"  Weighted F1: {f1:.4f}")
    print(f"  Accuracy: {report['accuracy']:.4f}")

    return {"classification_report": report, "f1_weighted": f1, "accuracy": report["accuracy"]}


def evaluate_yolo():
    """Evaluate YOLO detector."""
    print("\n📊 Evaluating YOLO...")
    yolo_weights = WEIGHTS_DIR / "yolo_best.pt"
    if not yolo_weights.exists():
        print("  ⚠ YOLO weights not found")
        return {}

    from ultralytics import YOLO

    model = YOLO(str(yolo_weights))
    data_yaml = BASE_DIR / "data" / "yolo" / "data.yaml"
    metrics = model.val(data=str(data_yaml), verbose=False)

    results = {
        "mAP50": float(metrics.box.map50) if metrics.box.map50 else 0.0,
        "mAP50-95": float(metrics.box.map) if metrics.box.map else 0.0,
        "precision": float(metrics.box.mp) if metrics.box.mp else 0.0,
        "recall": float(metrics.box.mr) if metrics.box.mr else 0.0,
    }
    print(f"  mAP@0.5: {results['mAP50']:.4f}")
    print(f"  Precision: {results['precision']:.4f}")
    print(f"  Recall: {results['recall']:.4f}")
    return results


def evaluate_segmentation():
    """Evaluate DeepLabV3+ segmentation IoU."""
    print("\n📊 Evaluating Segmentation...")
    seg_weights = WEIGHTS_DIR / "deeplabv3_best.pth"
    if not seg_weights.exists():
        print("  ⚠ Segmentation weights not found")
        return {}

    from torchvision.models.segmentation import deeplabv3_resnet50
    from train_all import SegmentationDataset

    NUM_SEG = len(CLASSES) + 1
    model = deeplabv3_resnet50(weights=None, num_classes=NUM_SEG)
    model.load_state_dict(torch.load(seg_weights, map_location=DEVICE, weights_only=True))
    model = model.to(DEVICE).eval()

    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    val_ds = SegmentationDataset(BASE_DIR / "data" / "segmentation" / "val", transform)
    if len(val_ds) == 0:
        return {}

    loader = DataLoader(val_ds, batch_size=4, shuffle=False)
    ious = []

    with torch.no_grad():
        for images, masks in loader:
            images = images.to(DEVICE)
            masks = nn.functional.interpolate(
                masks.unsqueeze(1).float(), size=(256, 256), mode="nearest"
            ).squeeze(1).long()

            out = model(images)["out"]
            preds = out.argmax(dim=1).cpu()

            for p, m in zip(preds, masks):
                for cls_id in range(1, NUM_SEG):
                    pred_mask = p == cls_id
                    true_mask = m == cls_id
                    intersection = (pred_mask & true_mask).sum().float()
                    union = (pred_mask | true_mask).sum().float()
                    if union > 0:
                        ious.append((intersection / union).item())

    mean_iou = np.mean(ious) if ious else 0.0
    print(f"  Mean IoU: {mean_iou:.4f}")
    return {"mean_iou": mean_iou}


def main():
    print("🌊 Model Evaluation Report\n")

    results = {
        "classifier": evaluate_classifier(),
        "yolo": evaluate_yolo(),
        "segmentation": evaluate_segmentation(),
    }

    with open(EVAL_DIR / "metrics.json", "w") as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\n✅ Evaluation saved to {EVAL_DIR}")


if __name__ == "__main__":
    main()
