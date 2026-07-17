# Vision-Based Deep Learning Framework for Coral Reef Health Mapping

**SPPU BE 2019 Pattern — Final Year Engineering Project**

An AI-powered system that detects, segments, classifies, and maps coral reef health from underwater images and drone footage.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React Frontend (Vite)                        │
│  Auth │ Dashboard │ Upload │ Live Inference │ Map │ Admin Panel     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ REST API (HTTPS)
┌──────────────────────────────▼──────────────────────────────────────┐
│                     FastAPI Backend (Python)                        │
│  Auth Middleware │ Inference │ Reports │ Admin │ CSV Export         │
└──────┬──────────────────┬──────────────────┬────────────────────────┘
       │                  │                  │
┌──────▼──────┐   ┌───────▼───────┐   ┌───────▼────────┐
│  Firebase   │   │  ML Pipeline  │   │  PDF + QR Gen  │
│ Auth/FStore │   │ YOLO/U-Net/EN │   │  ReportLab     │
└─────────────┘   └───────────────┘   └────────────────┘
```

### Module Breakdown

| Folder | Purpose |
|--------|---------|
| `ml/` | Dataset download, training (transfer learning), evaluation, inference |
| `backend/` | FastAPI REST API, Firebase integration, PDF reports |
| `frontend/` | React SPA with Leaflet maps, glassmorphism UI |
| `.github/` | CI/CD with GitHub Actions |
| `firestore.rules` | Secure Firebase database rules with RBAC |

---

## Quick Start (24-Hour Training Path)

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
python train_all.py               # Fine-tunes YOLO + DeepLabV3+ + EfficientNet (3 epochs each)
python evaluate.py                # Confusion matrix, IoU, F1-score
```

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

### 4. Frontend

```bash
cd frontend
npm install
npm run build    # Production build
npm run preview  # Or deploy dist/ to Render/Vercel
```

### 5. Docker (Full Stack)

```bash
docker-compose up --build
```

---

## Firebase Setup

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password + Google
3. Create **Firestore** database
4. Deploy rules: `firebase deploy --only firestore:rules`
5. Generate service account JSON → save as `backend/firebase-service-account.json`
6. Add Web App config to `.env.production` (VITE_FIREBASE_* vars)

### Admin Seed Account

On first startup, the backend seeds:
- **Email:** shivashankrmali7@gmail.com
- **Password:** Shivmali@123
- **Role:** admin

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | Email/password login |
| POST | `/api/v1/inference/upload` | Upload image/video |
| POST | `/api/v1/inference/live` | Live camera inference |
| GET | `/api/v1/reports/{id}` | Get report |
| PUT | `/api/v1/reports/{id}/override` | Admin override report |
| GET | `/api/v1/reports/{id}/pdf` | Download PDF |
| GET | `/api/v1/reports/{id}/csv` | Export CSV |
| GET | `/api/v1/dashboard/stats` | User dashboard stats |
| GET | `/api/v1/admin/users` | Admin: list all users |
| GET | `/api/v1/admin/analytics` | Admin: system analytics |
| GET | `/api/v1/public/report/{qr_token}` | Public QR page data |

---

## Deployment (Render / AWS)

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step Render and AWS ECS deployment.

---

## Model Performance Targets

| Model | Task | Target Metric |
|-------|------|---------------|
| YOLOv11n | Object Detection | mAP@0.5 > 0.85 |
| DeepLabV3+ (ResNet50) | Segmentation | IoU > 0.80 |
| EfficientNet-B0 | Classification | F1 > 0.90 |

Transfer learning on pre-trained weights achieves these in 3 epochs on the lightweight subset.

---

## Future Scope

- Multi-spectral satellite integration (Sentinel-2)
- Temporal bleaching trend prediction (LSTM)
- Edge deployment on NVIDIA Jetson for field use
- Federated learning across reef monitoring organizations
- 3D reef reconstruction from stereo video

## Limitations

- Training subset is lightweight for 24-hour deadline; full NOAA/CoralNet datasets improve accuracy
- Underwater color correction is heuristic; physics-based models would improve generalization
- GPS tagging requires EXIF metadata or manual pin placement on map
- Real-time video at 4K requires GPU inference server

---

## License

MIT — Academic use for SPPU Final Year Project submission.
