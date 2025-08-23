from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from app.api.routes import api_router
from app.core.config import settings

app = FastAPI(
    title="SayWrite API",
    description="API for speech-to-text and text rewriting",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/v1")

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": app.version}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5175))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
