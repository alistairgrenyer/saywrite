import base64
import os
import tempfile
import logging
from typing import Optional

from app.core.config import settings
from app.api.schemas import TranscriptionResponse

logger = logging.getLogger(__name__)

async def transcribe_audio(
    audio: str,
    audio_format: str,
    language: Optional[str] = "en"
) -> TranscriptionResponse:
    """
    Transcribe audio using OpenAI Whisper
    
    Args:
        audio: Base64 encoded audio data
        audio_format: Audio format (e.g., 'wav', 'mp3')
        language: Language code for transcription
        
    Returns:
        TranscriptionResponse with transcribed text
    """
    logger.info(f"Transcribing audio in {language} format: {audio_format}")
    
    # Decode base64 audio
    try:
        audio_data = base64.b64decode(audio)
    except Exception as e:
        logger.error(f"Failed to decode base64 audio: {e}")
        raise ValueError(f"Invalid base64 audio data: {e}")
    
    # Save to temporary file
    with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as temp_file:
        temp_file.write(audio_data)
        temp_path = temp_file.name
    
    try:
        # Use OpenAI Whisper for transcription
        result = await transcribe_with_whisper(temp_path, language)
        return result
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

async def transcribe_with_whisper(audio_path: str, language: str) -> TranscriptionResponse:
    """
    Transcribe audio using OpenAI Whisper
    
    Args:
        audio_path: Path to audio file
        language: Language code
        
    Returns:
        TranscriptionResponse with transcribed text
    """
    try:
        import openai
        
        # Set API key
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set")
        
        openai.api_key = settings.OPENAI_API_KEY
        
        # Open the audio file
        with open(audio_path, "rb") as audio_file:
            # Call Whisper API
            response = await openai.Audio.atranscribe(
                model=settings.OPENAI_WHISPER_MODEL,
                file=audio_file,
                language=language
            )
            
            # Extract transcription
            text = response.get("text", "")
            
            return TranscriptionResponse(
                text=text,
                language=language,
                confidence=0.9  # Whisper doesn't provide confidence scores
            )
    except ImportError:
        logger.error("OpenAI package not installed")
        raise ImportError("Please install openai package: pip install openai")
    except Exception as e:
        logger.error(f"Whisper transcription error: {e}")
        raise Exception(f"Failed to transcribe with Whisper: {e}")
