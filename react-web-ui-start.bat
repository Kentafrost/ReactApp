@echo off

echo Starting FastAPI backend(uvicorn)
Start cmd /k "cd react-web-ui/backend/routes && uvicorn backend.main:app --reload --port 5000"

echo Starting React frontend
Start cmd /k "cd react-web-ui/frontend && npm start"

echo All services started.