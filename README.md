<div align="center">
  <h1>🌊 CoralAI: Deep Learning Framework for Coral Reef Health Mapping</h1>
  <p><strong>An AI-powered system that detects, segments, classifies, and maps coral reef health from underwater images and drone footage.</strong></p>
  <p><i>SPPU BE 2019 Pattern — Final Year Engineering Project</i></p>
</div>

<br />

<div align="center">
  <img src="docs/diagrams/system_architecture.png" alt="System Architecture" width="800" />
</div>

<br />

## 🚨 Problem Statement
Coral reefs are among the most diverse ecosystems on the planet but are under severe threat from climate change, ocean acidification, and human activities. Rapid and widespread coral bleaching events are difficult to monitor manually. Marine biologists face challenges in processing vast amounts of underwater imagery to accurately quantify coral health, leading to delayed conservation efforts and inaccurate mapping.

## 📉 Existing Solutions vs. Limitations
- **Manual Annotation:** Highly accurate but extremely slow, labor-intensive, and fundamentally unscalable for monitoring large geographical areas.
- **Traditional Machine Learning:** Relies on hand-crafted features which struggle to generalize given the complex, low-contrast, and color-distorted nature of underwater environments.
- **Basic Image Classification CNNs:** Often provide only image-level classification (e.g., "This image contains bleached coral") without providing precise pixel-level area quantification, which is essential for biological assessments.

## 🚀 Our Solution & Approach
CoralAI addresses these limitations by utilizing a comprehensive **Vision-Based Deep Learning Framework**:
1. **Semantic Segmentation:** We deploy state-of-the-art architectures (like U-Net and DeepLabV3+) to classify every individual pixel. This provides precise area coverage percentages for Healthy Coral, Bleached Coral, Dead Coral, and Algae.
2. **End-to-End Pipeline:** From an intuitive React frontend to a high-performance FastAPI backend, users can seamlessly upload images, view real-time processing, and generate detailed PDF reports.
3. **Automated Pre-processing:** Computer vision techniques (via OpenCV) are utilized to automatically correct the blue/green color cast typical in underwater photography, significantly improving the model's accuracy.

<br />

<div align="center">
  <img src="docs/diagrams/algorithm_flowchart.png" alt="Algorithm Flowchart" width="600" />
</div>

<br />

## 🛠️ Architecture Overview

The system is built on a modern, decoupled technology stack:
- **Frontend:** React (Vite) featuring a glassmorphism UI, Context API for state management, and Leaflet for geospatial mapping.
- **Backend:** FastAPI (Python) for asynchronous, high-performance REST APIs.
- **Database & Auth:** Firebase Authentication and Firestore (NoSQL) secured tightly with Role-Based Access Control (RBAC).
- **ML Pipeline:** PyTorch/TensorFlow models optimized for rapid inference and background processing.

<br />

## 🚀 Quick Start (24-Hour Training Path)

### 1. Environment Setup
```bash
# Copy and fill environment variables
cp .env.production.example .env.production
# Edit all VITE_* and backend vars with your Firebase/Render URLs
```

### 2. ML Training (Transfer Learning — ~30 min)
```bash
cd ml
pip install -r requirements.txt
python download_dataset.py      # Downloads lightweight subset (~50 MB)
python train_all.py             # Fine-tunes YOLO + DeepLabV3+ + EfficientNet
python evaluate.py              # Confusion matrix, IoU, F1-score
```

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

<br />

## 🔐 Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** (Email/Password & Google) and **Firestore**.
3. Generate a service account JSON and save it as `backend/firebase-service-account.json`.
4. Deploy security rules: `firebase deploy --only firestore:rules`
5. Update `.env.production` with your Web App config.

### Admin Seed Account
On first startup, the backend seeds an admin account:
- **Email:** shivashankrmali7@gmail.com
- **Password:** Shivmali@123
- **Role:** admin

<br />

## 📈 Model Performance Targets
| Model | Task | Target Metric |
|-------|------|---------------|
| YOLOv11n | Object Detection | mAP@0.5 > 0.85 |
| DeepLabV3+ (ResNet50)| Segmentation | IoU > 0.80 |
| EfficientNet-B0 | Classification | F1 > 0.90 |

<br />

## 🔮 Future Scope
- **Multi-spectral satellite integration** (Sentinel-2) for macro-level mapping.
- **Temporal bleaching trend prediction** using LSTM networks.
- **Edge deployment** on NVIDIA Jetson for real-time field use on boats.
- **3D reef reconstruction** from stereo video footage.

<br />

## 📄 License
MIT — Academic use for SPPU Final Year Project submission.
