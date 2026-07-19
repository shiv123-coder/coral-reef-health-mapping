import os
import sys
import tempfile
import base64
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

# Allow importing from either a sibling 'ml' directory or a child 'ml' directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'ml')))

try:
    from inference import run_full_inference
except ImportError as e:
    print(f"Failed to import inference: {e}")
    run_full_inference = None

app = FastAPI(title="CoralAI ML Inference Service")

@app.get("/")
def read_root():
    return {"status": "ML Inference Service is running", "onnx_ready": run_full_inference is not None}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not run_full_inference:
        raise HTTPException(status_code=500, detail="Inference module not loaded correctly.")
        
    tmp_path = None
    annotated_path = None
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
            
        # Run inference
        result = run_full_inference(tmp_path, output_dir=os.path.dirname(tmp_path))
        
        # Read the annotated image and convert to base64 so we can send it back in JSON
        annotated_path = result.get("annotated_image")
        annotated_b64 = None
        if annotated_path and os.path.exists(annotated_path):
            with open(annotated_path, "rb") as img_file:
                annotated_b64 = base64.b64encode(img_file.read()).decode('utf-8')
            
        result["annotated_image_base64"] = annotated_b64
        # Remove the local path from result as it's meaningless to the caller
        if "annotated_image" in result:
            del result["annotated_image"]
        if "processed_image" in result:
            del result["processed_image"]
            
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp files
        if tmp_path and os.path.exists(tmp_path):
            try: os.remove(tmp_path)
            except: pass
        if annotated_path and os.path.exists(annotated_path):
            try: os.remove(annotated_path)
            except: pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
