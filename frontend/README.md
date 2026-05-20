# Frontend (React + Vite)

This project contains a React frontend (Vite) that integrates with a Python backend exposing a Gradio UI and FastAPI endpoints.

**What this file covers**
- How to run the backend (Gradio + FastAPI)
- How to run the frontend (Vite)
- Environment variables and ports
- Where to view the Gradio app and API endpoints

**Quick overview**
- Backend (Gradio + FastAPI): `app.py` — runs a Gradio Blocks UI mounted at `/` and several API endpoints (e.g. `/run/predict`, `/api/weather`, `/api/history`). The backend serves on port `7860` by default.
- Frontend: Vite React app in this folder. It includes a `GradioEmbed` component that embeds the Gradio UI via an iframe pointing to `http://localhost:7860`.

**Prerequisites**
- Python 3.8+ and pip
- Node.js + npm (for the frontend)

**Backend: install & run**
1. Create and activate a Python virtual environment (PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
2. Install Python dependencies:
```powershell
pip install -r ..\requirements.txt
```
3. Run the backend (starts Uvicorn + Gradio):
```powershell
python ..\app.py
```
The Gradio UI and API will be available at: http://localhost:7860/

Environment variables (optional):
- `GEMINI_API_KEY` — if provided, the app will use Google Gemini for AI text generation; otherwise it falls back to local explanations.
- `OPENWEATHERMAP_API_KEY` — optional; without it the `/api/weather` endpoint returns mock data.

**Frontend: install & run**
1. From this folder install dependencies and start the dev server:
```bash
npm install
npm run dev
```
2. By default Vite shows a local dev URL (typically `http://localhost:5173`). The frontend contains a `Gradio Workspace` component that embeds the Gradio backend at `http://localhost:7860`.

Notes about proxy and API calls
- The Vite dev server config (`vite.config.js`) defines a proxy mapping `/gradio_api` to `http://localhost:7860`. This can be used to avoid cross-origin requests in dev by calling `/gradio_api/run/predict` from the frontend; however the backend already enables CORS so direct calls to `http://localhost:7860/run/predict` also work.

Example curl to call the prediction endpoint (replace `leaf.jpg`):
```bash
curl -X POST "http://localhost:7860/run/predict" -F "data=@leaf.jpg" 
```

Common endpoints
- Gradio web UI: `GET /` (http://localhost:7860/)
- Prediction API (multipart file): `POST /run/predict`
- Weather API (mock or real): `GET /api/weather?city=...` or `?lat=...&lon=...`
- History endpoints: `GET /api/history`, `POST /api/history`, `DELETE /api/history`

If you want, I can start the backend now in the terminal and open the Gradio UI. Would you like me to run it? 

