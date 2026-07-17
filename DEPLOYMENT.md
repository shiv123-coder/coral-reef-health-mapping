# Deployment Guide — Coral Reef Health Mapping

## Render Deployment (Recommended)

### Backend (Web Service)

1. Create new **Web Service** on [render.com](https://render.com)
2. Connect GitHub repo, root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.production.example` (backend section)
6. Upload `firebase-service-account.json` as secret file or paste JSON into `FIREBASE_SERVICE_ACCOUNT_JSON`

### Frontend (Static Site)

1. Create **Static Site** on Render
2. Root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add all `VITE_*` environment variables

### Environment Variables (Production)

```bash
# Backend on Render
API_BASE_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.onrender.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
CORS_ORIGINS=https://your-frontend.onrender.com
MODEL_DIR=/opt/render/project/src/ml/weights
UPLOAD_DIR=/tmp/uploads
SECRET_KEY=generate-a-strong-random-key

# Frontend on Render
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_PUBLIC_REPORT_BASE_URL=https://your-frontend.onrender.com/public/report
```

---

## AWS ECS Deployment

### 1. Build & Push Docker Images

```bash
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com

docker build -t coral-reef-backend ./backend
docker tag coral-reef-backend:latest YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/coral-reef-backend:latest
docker push YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/coral-reef-backend:latest

docker build -t coral-reef-frontend ./frontend
docker tag coral-reef-frontend:latest YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/coral-reef-frontend:latest
docker push YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/coral-reef-frontend:latest
```

### 2. ECS Task Definition

- Backend: 2 vCPU, 4 GB RAM (GPU optional for faster inference)
- Frontend: nginx serving `dist/`
- Mount EFS for `UPLOAD_DIR` and model weights

### 3. Application Load Balancer

- HTTPS listener with ACM certificate
- Route `/api/*` → backend target group
- Route `/*` → frontend target group

---

## Firebase Rules Deployment

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # Select existing project
firebase deploy --only firestore:rules
```

---

## Post-Deploy Checklist

- [ ] Firebase Auth domains include production URLs
- [ ] CORS_ORIGINS matches frontend URL exactly
- [ ] ML weights uploaded to server or baked into Docker image
- [ ] Admin seed account verified
- [ ] QR code public report URLs resolve correctly
- [ ] HTTPS enforced on all endpoints
