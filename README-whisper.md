# Whisper.cpp Integration Setup

This document explains how to set up Whisper.cpp for local speech-to-text transcription in SayWrite.

## Prerequisites

### 1. Whisper.cpp Binary

You need to compile or download the Whisper.cpp executable:

**Option A: Download Pre-compiled Binary**
- Visit the [Whisper.cpp releases page](https://github.com/ggerganov/whisper.cpp/releases)
- Download the appropriate binary for your platform
- Rename it to `main.exe` (Windows) or `main` (macOS/Linux)

**Option B: Compile from Source**
```bash
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make
```

### 2. Whisper Model Files

Download a Whisper model file (GGML format):

**Recommended Models:**
- `ggml-base.en.bin` (142 MB) - Good balance of speed and accuracy for English
- `ggml-small.en.bin` (466 MB) - Better accuracy, slower
- `ggml-tiny.en.bin` (39 MB) - Fastest, lower accuracy

**Download Command:**
```bash
# Base English model (recommended)
curl -L -o ggml-base.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin

# Or use the download script from whisper.cpp
bash ./models/download-ggml-model.sh base.en
```

## Installation

1. Create a `whisper` directory in your project root:
   ```
   saywrite/
   ├── whisper/
   │   ├── main.exe (or main)
   │   └── ggml-base.en.bin
   ├── src/
   ├── electron/
   └── ...
   ```

2. Place the compiled `main` executable in the `whisper/` directory

3. Place your chosen model file (e.g., `ggml-base.en.bin`) in the `whisper/` directory

## Configuration

The app will automatically detect the Whisper binary and model files. Default settings:

- **Model**: `ggml-base.en.bin`
- **Language**: English (`en`)
- **Threads**: 4
- **Temperature**: 0.0 (deterministic output)

## Usage

1. Click the microphone button to start recording
2. Speak clearly into your microphone
3. Click again to stop recording
4. The app will automatically:
   - Convert your audio to WAV format (16kHz mono)
   - Run Whisper.cpp transcription
   - Display the result in the transcript bubble

## Troubleshooting

### "Whisper binary not found"
- Ensure `main.exe` (Windows) or `main` (macOS/Linux) is in the `whisper/` directory
- Make sure the file has execute permissions: `chmod +x whisper/main`
- Alternatively, add the whisper binary to your system PATH

### "Whisper model not found"
- Download the model file and place it in the `whisper/` directory
- Ensure the filename matches exactly (e.g., `ggml-base.en.bin`)
- Check file permissions and that it's not corrupted

### "Transcription failed"
- Check that your microphone is working and permissions are granted
- Try a smaller model file (e.g., `ggml-tiny.en.bin`) for testing
- Check the console logs for detailed error messages

### Performance Issues
- Use a smaller model (`ggml-tiny.en.bin`) for faster transcription
- Reduce the number of threads in settings if CPU usage is too high
- Ensure you have sufficient RAM (models can use 1-2GB)

## Model Comparison

| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| tiny.en | 39 MB | Fastest | Basic | Quick testing, low-end devices |
| base.en | 142 MB | Fast | Good | **Recommended for most users** |
| small.en | 466 MB | Medium | Better | Higher accuracy needs |
| medium.en | 1.5 GB | Slow | Best | Professional transcription |

## Development

For development, you can test the Whisper integration:

1. Start the app: `npm run dev`
2. Click the microphone and speak
3. Check the console for Whisper command output
4. The transcript should appear in the bubble

The app includes error handling for missing binaries/models and will show helpful error messages in the UI.
