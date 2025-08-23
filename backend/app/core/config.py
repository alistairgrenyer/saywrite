import os
from typing import Optional
from pydantic import BaseSettings, validator


class Settings(BaseSettings):
    """Application settings"""
    
    # API settings
    PORT: int = 5175
    LOG_LEVEL: str = "INFO"
    ENABLE_REDACTION: bool = False
    
    # OpenAI settings
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_WHISPER_MODEL: str = "whisper-1"
    
    # STT settings
    STT_PROVIDER: str = "whisper"  # Only whisper supported
    
    @validator("STT_PROVIDER")
    def validate_stt_provider(cls, v):
        if v != "whisper":
            raise ValueError("STT_PROVIDER must be 'whisper'")
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
