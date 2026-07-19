import onnxruntime as ort
import numpy as np

def inspect_models():
    import os
    from pathlib import Path
    
    BASE_DIR = Path(__file__).parent
    WEIGHTS_DIR = BASE_DIR / "weights"
    
    print("--- DeepLabV3 ONNX ---")
    seg_path = WEIGHTS_DIR / "deeplabv3_best.onnx"
    if seg_path.exists():
        sess = ort.InferenceSession(str(seg_path), providers=['CPUExecutionProvider'])
        for i, opt in enumerate(sess.get_outputs()):
            print(f"Output {i}: Name='{opt.name}', Shape={opt.shape}")
    else:
        print("Not found.")
        
    print("\n--- EfficientNet ONNX ---")
    cls_path = WEIGHTS_DIR / "efficientnet_best.onnx"
    if cls_path.exists():
        sess = ort.InferenceSession(str(cls_path), providers=['CPUExecutionProvider'])
        for i, opt in enumerate(sess.get_outputs()):
            print(f"Output {i}: Name='{opt.name}', Shape={opt.shape}")
    else:
        print("Not found.")

if __name__ == "__main__":
    inspect_models()
