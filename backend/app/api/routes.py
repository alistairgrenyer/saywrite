from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from app.api.schemas import (
    TranscriptionRequest, 
    TranscriptionResponse,
    RewriteRequest,
    RewriteResponse
)
from app.services.transcription import transcribe_audio
from app.services.rewrite import rewrite_text

api_router = APIRouter()

@api_router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    request: TranscriptionRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Transcribe audio to text
    """
    try:
        result = await transcribe_audio(
            audio=request.audio,
            audio_format=request.audio_format,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

@api_router.post("/rewrite", response_model=RewriteResponse)
async def rewrite(
    request: RewriteRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Rewrite text according to specified profile
    """
    try:
        result = await rewrite_text(
            transcript=request.transcript,
            profile=request.profile,
            options=request.options
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rewriting error: {str(e)}")
