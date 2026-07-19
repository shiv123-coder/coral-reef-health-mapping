import os
import torch
import torch.nn as nn
from pathlib import Path

# Models
from ultralytics import YOLO
from torchvision.models.segmentation import deeplabv3_resnet50
from torchvision import models

BASE_DIR = Path(__file__).parent
WEIGHTS_DIR = BASE_DIR / "weights"
DEVICE = torch.device("cpu")
CLASSES = ["healthy_coral", "bleached_coral", "dead_coral", "algae", "sand", "rock"]

def convert_yolo():
    print("Converting YOLO to ONNX...")
    path = WEIGHTS_DIR / "yolo_best.pt"
    if not path.exists():
        path = "yolo11n.pt"
    model = YOLO(str(path))
    # YOLO ultralytics native export
    model.export(format="onnx", opset=12, simplify=True)
    print("YOLO ONNX export complete.")

def convert_segmentation():
    print("Converting DeepLabV3 to ONNX...")
    path = WEIGHTS_DIR / "deeplabv3_best.pth"
    if not path.exists():
        print("deeplabv3_best.pth not found. Skipping.")
        return
        
    num_classes = len(CLASSES) + 1
    model = deeplabv3_resnet50(weights=None, num_classes=num_classes)
    model.load_state_dict(torch.load(path, map_location=DEVICE, weights_only=True), strict=False)
    model.to(DEVICE)
    model.eval()
    
    # 256x256 as used in inference.py run_segmentation
    dummy_input = torch.randn(1, 3, 256, 256, device=DEVICE)
    onnx_path = WEIGHTS_DIR / "deeplabv3_best.onnx"
    
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print("DeepLabV3 ONNX export complete.")

def convert_classifier():
    print("Converting EfficientNet to ONNX...")
    path = WEIGHTS_DIR / "efficientnet_best.pth"
    if not path.exists():
        print("efficientnet_best.pth not found. Skipping.")
        return
        
    ckpt = torch.load(path, map_location=DEVICE, weights_only=False)
    num_classes = ckpt.get("num_classes", len(CLASSES))
    
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    model.load_state_dict(ckpt["model_state_dict"])
    model.to(DEVICE)
    model.eval()
    
    # 224x224 as used in inference.py run_classification
    dummy_input = torch.randn(1, 3, 224, 224, device=DEVICE)
    onnx_path = WEIGHTS_DIR / "efficientnet_best.onnx"
    
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print("EfficientNet ONNX export complete.")

if __name__ == "__main__":
    convert_yolo()
    convert_segmentation()
    convert_classifier()
