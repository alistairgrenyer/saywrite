# SayWrite

SayWrite is an Electron application that provides speech-to-text transcription and text rewriting capabilities using OpenAI's services.

## Features

- Speech-to-text transcription using OpenAI Whisper
- Text rewriting with multiple style profiles using OpenAI GPT-4o
- Local FastAPI backend for AI service integration
- Electron-based desktop application

## Architecture

SayWrite uses a hybrid architecture:

1. **Electron Frontend**: The main application UI built with Electron, React, and TypeScript
2. **FastAPI Backend**: A Python-based backend that handles AI service integration
3. **OpenAI Integration**: Uses OpenAI APIs for transcription (Whisper) and text rewriting (GPT-4o)

## Setup

### Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- OpenAI API key

### Installation

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Configure environment variables:

Create a `.env` file in the backend directory:

```
PORT=5175
LOG_LEVEL=INFO
ENABLE_REDACTION=False

# OpenAI settings
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
OPENAI_WHISPER_MODEL=whisper-1
```

## Development

Start the application in development mode:

```bash
npm run dev
```

This will start both the Electron application and the FastAPI backend.

## Building

Build the application:

```bash
npm run build
```

## License

[MIT License](LICENSE)
