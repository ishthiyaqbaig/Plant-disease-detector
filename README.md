# LeafScan AI — Plant Disease Detector

Small demo application that combines a Python backend (FastAPI + Gradio) and a React frontend (Vite). The backend runs a Gradio Blocks UI (mounted at `/`) and exposes API endpoints used by the React app.

Quick run (recommended)

1) Backend (from repository root) — create venv, install, run:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

This starts the FastAPI + Gradio server on port `7860` (http://localhost:7860/).

2) Frontend (from `frontend/`):

```bash
cd frontend
npm install
npm run dev
```

Notes and housekeeping
- Do NOT commit `history.json` — it contains base64-encoded images and will bloat the repo. To untrack it locally before pushing:

```bash
git rm --cached history.json
git add .gitignore README.md
git commit -m "Add .gitignore and project README; untrack history.json"
git push origin main
```

- Environment variables (optional): `GEMINI_API_KEY`, `OPENWEATHERMAP_API_KEY`.

License
- Add a `LICENSE` file if you want to set project terms (MIT is common for demos).
