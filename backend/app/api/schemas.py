from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class TranscriptionRequest(BaseModel):
    """Request model for audio transcription"""
    audio: str = Field(..., description="Base64 encoded audio data")
    audio_format: str = Field(..., description="Audio format (e.g., 'wav', 'mp3')")
    language: Optional[str] = Field("en", description="Language code for transcription")

class TranscriptionResponse(BaseModel):
    """Response model for audio transcription"""
    text: str = Field(..., description="Transcribed text")
    language: str = Field(..., description="Language of transcription")
    confidence: float = Field(..., description="Confidence score of transcription")

class RewriteOptions(BaseModel):
    """Options for text rewriting"""
    temperature: float = Field(0.7, description="Temperature for text generation")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens to generate")
    
class RewriteRequest(BaseModel):
    """Request model for text rewriting"""
    transcript: str = Field(..., description="Text to rewrite")
    profile: str = Field(..., description="Rewriting profile/style")
    options: Optional[RewriteOptions] = Field(None, description="Rewriting options")

class RewriteResponse(BaseModel):
    """Response model for text rewriting"""
    text: str = Field(..., description="Rewritten text")
