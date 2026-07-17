"""
train_all.py — Transfer learning pipeline for all three models.

Runs fine-tuning for 3 epochs each (configurable via TRAIN_EPOCHS env var):
  1. YOLOv11n — object detection
  2. DeepLabV3+ (ResNet50) — semantic segmentation
  3. EfficientNet-B0 — health classification

Expected runtime: ~20-30 minutes on CPU, ~5-10 min on GPU.
"""

import os
import json
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from torchvision.models.segmentation import deeplabv3_resnet50, DeepLabV3_ResNet50_Weights
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env.production")

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
WEIGHTS_DIR = BASE_DIR / "weights"
WEIGHTS_DIR.mkdir(exist_ok=True)

EPOCHS = int(os.getenv("TRAIN_EPOCHS", "3"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "8"))
LR = float(os.getenv("LEARNING_RATE", "0.001"))
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CLASSES = [
    "healthy_coral", "bleached_coral", "dead_coral",
    "algae", "sand", "rock",
]
NUM_CLASSES = len(CLASSES)
NUM_SEG_CLASSES = NUM_CLASSES + 1  # +background


def train_yolo():
    """Fine-tune YOLOv11n on coral detection dataset."""
    print("\n🔵 Training YOLOv11n (Detection)...")
    from ultralytics import YOLO

    data_yaml = DATA_DIR / "yolo" / "data.yaml"
    if not data_yaml.exists():
        raise FileNotFoundError("Run download_dataset.py first")

    model = YOLO("yolo11n.pt")  # Pre-trained nano model — fast inference
    results = model.train(
        data=str(data_yaml),
        epochs=EPOCHS,
        imgsz=640,
        batch=BATCH_SIZE,
        project=str(WEIGHTS_DIR),
        name="yolo_coral",
        exist_ok=True,
        patience=10,
        device=0 if torch.cuda.is_available() else "cpu",
        verbose=True,
    )

    best = WEIGHTS_DIR / "yolo_coral" / "weights" / "best.pt"
    final = WEIGHTS_DIR / "yolo_best.pt"
    if best.exists():
        import shutil
        shutil.copy2(best, final)
    print(f"✅ YOLO saved: {final}")
    return results


class SegmentationDataset(torch.utils.data.Dataset):
    """Simple segmentation dataset from images + mask folders."""

    def __init__(self, root, transform=None):
        self.root = Path(root)
        self.images = sorted((self.root / "images").glob("*.jpg"))
        self.transform = transform

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        import cv2
        import numpy as np
        from PIL import Image

        img_path = self.images[idx]
        mask_path = self.root / "masks" / img_path.name

        image = Image.open(img_path).convert("RGB")
        mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
        if mask is None:
            mask = np.zeros((image.size[1], image.size[0]), dtype=np.uint8)

        if self.transform:
            image = self.transform(image)

        mask = torch.from_numpy(mask).long()
        return image, mask


def train_segmentation():
    """Fine-tune DeepLabV3+ for coral segmentation."""
    print("\n🟢 Training DeepLabV3+ (Segmentation)...")

    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    train_ds = SegmentationDataset(DATA_DIR / "segmentation" / "train", transform)
    val_ds = SegmentationDataset(DATA_DIR / "segmentation" / "val", transform)

    if len(train_ds) == 0:
        print("⚠ No segmentation data — skipping")
        return

    train_loader = DataLoader(train_ds, batch_size=4, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=4, shuffle=False, num_workers=0)

    weights = DeepLabV3_ResNet50_Weights.DEFAULT
    model = deeplabv3_resnet50(weights=weights)
    model.classifier[-1] = nn.Conv2d(256, NUM_SEG_CLASSES, kernel_size=1)
    model = model.to(DEVICE)

    optimizer = optim.Adam(model.parameters(), lr=LR)
    criterion = nn.CrossEntropyLoss(ignore_index=255)

    best_iou = 0.0
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0.0
        for images, masks in train_loader:
            images = images.to(DEVICE)
            masks = nn.functional.interpolate(
                masks.unsqueeze(1).float(), size=(256, 256), mode="nearest"
            ).squeeze(1).long().to(DEVICE)

            optimizer.zero_grad()
            out = model(images)["out"]
            loss = criterion(out, masks)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        # Validation IoU
        model.eval()
        iou_sum = 0.0
        count = 0
        with torch.no_grad():
            for images, masks in val_loader:
                images = images.to(DEVICE)
                masks = nn.functional.interpolate(
                    masks.unsqueeze(1).float(), size=(256, 256), mode="nearest"
                ).squeeze(1).long().to(DEVICE)
                out = model(images)["out"]
                preds = out.argmax(dim=1)
                intersection = ((preds == masks) & (masks > 0)).sum().float()
                union = ((preds > 0) | (masks > 0)).sum().float()
                if union > 0:
                    iou_sum += (intersection / union).item()
                    count += 1

        avg_iou = iou_sum / max(count, 1)
        print(f"  Epoch {epoch+1}/{EPOCHS} — Loss: {train_loss/len(train_loader):.4f}, IoU: {avg_iou:.4f}")

        if avg_iou > best_iou:
            best_iou = avg_iou
            torch.save(model.state_dict(), WEIGHTS_DIR / "deeplabv3_best.pth")

    print(f"✅ Segmentation saved: {WEIGHTS_DIR / 'deeplabv3_best.pth'} (IoU: {best_iou:.4f})")


def train_classifier():
    """Fine-tune EfficientNet-B0 for coral health classification."""
    print("\n🟡 Training EfficientNet-B0 (Classification)...")

    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    train_dir = DATA_DIR / "classification" / "train"
    val_dir = DATA_DIR / "classification" / "val"

    if not train_dir.exists():
        print("⚠ No classification data — skipping")
        return

    train_ds = datasets.ImageFolder(str(train_dir), transform=train_transform)
    val_ds = datasets.ImageFolder(str(val_dir), transform=val_transform)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, NUM_CLASSES)
    model = model.to(DEVICE)

    optimizer = optim.Adam(model.parameters(), lr=LR)
    criterion = nn.CrossEntropyLoss()

    best_acc = 0.0
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0.0
        correct = 0
        total = 0
        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        train_acc = 100.0 * correct / max(total, 1)

        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

        val_acc = 100.0 * val_correct / max(val_total, 1)
        print(f"  Epoch {epoch+1}/{EPOCHS} — Train Acc: {train_acc:.1f}%, Val Acc: {val_acc:.1f}%")

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({
                "model_state_dict": model.state_dict(),
                "class_names": train_ds.classes,
                "num_classes": NUM_CLASSES,
            }, WEIGHTS_DIR / "efficientnet_best.pth")

    print(f"✅ Classifier saved: {WEIGHTS_DIR / 'efficientnet_best.pth'} (Acc: {best_acc:.1f}%)")


def main():
    print(f"🌊 Coral Reef ML Training Pipeline")
    print(f"   Device: {DEVICE} | Epochs: {EPOCHS} | Batch: {BATCH_SIZE}\n")

    if not (DATA_DIR / "dataset_meta.json").exists():
        print("❌ Dataset not found. Run: python download_dataset.py")
        return

    train_yolo()
    train_segmentation()
    train_classifier()

    summary = {
        "epochs": EPOCHS,
        "device": str(DEVICE),
        "weights": {
            "yolo": str(WEIGHTS_DIR / "yolo_best.pt"),
            "segmentation": str(WEIGHTS_DIR / "deeplabv3_best.pth"),
            "classifier": str(WEIGHTS_DIR / "efficientnet_best.pth"),
        },
    }
    with open(WEIGHTS_DIR / "training_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print("\n🎉 All models trained! Run: python evaluate.py")


if __name__ == "__main__":
    main()
