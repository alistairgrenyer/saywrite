# SayWrite FastAPI Backend

This is the FastAPI backend for the SayWrite application, providing speech-to-text transcription and text rewriting services.

## Features

- Speech-to-text transcription using OpenAI Whisper
- Text rewriting using OpenAI GPT-4o
- RESTful API with FastAPI
- Environment-based configuration

## Setup

### Prerequisites

- Python 3.9+
- pip

### Installation

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the backend directory with your configuration:

```
PORT=5175
LOG_LEVEL=INFO
ENABLE_REDACTION=False

# OpenAI settings
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
OPENAI_WHISPER_MODEL=whisper-1
```

## Running the Backend

Start the backend server:

```bash
cd backend
python -m app.main
```

The API will be available at `http://localhost:5175`.

## API Endpoints

### Health Check

```
GET /health
```

Returns the API status and version.

### Transcription

```
POST /v1/transcribe
```

Request body:
```json
{
  "audio": "base64_encoded_audio_data",
  "audio_format": "wav",
  "language": "en"
}
```

### Text Rewriting

```
POST /v1/rewrite
```

Request body:
```json
{
  "transcript": "Text to rewrite",
  "profile": "professional",
  "options": {
    "temperature": 0.7,
    "max_tokens": 2000
  }
}
```

Available profiles: professional, casual, academic, creative, technical, simplified
