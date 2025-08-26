import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioCapture, AudioLevelData } from '../utils/audioCapture';
import './Bubble.css';

function Bubble() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState<AudioLevelData>({ rms: 0, peak: 0, timestamp: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const audioCapture = useRef<AudioCapture | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize audio capture
    audioCapture.current = new AudioCapture({
      sampleRate: 16000,
      channels: 1,
      bufferSize: 2048
    });

    // Set up IPC listeners
    window.app.onFinal((text) => {
      setTranscript(text);
      setRecording(false);
      setAudioLevel({ rms: 0, peak: 0, timestamp: 0 });
    });

    window.app.onSTTError((errorMsg) => {
      setError(errorMsg);
      setRecording(false);
      setAudioLevel({ rms: 0, peak: 0, timestamp: 0 });
    });

    return () => {
      if (audioCapture.current) {
        audioCapture.current.dispose();
      }
    };
  }, []);

  const handleLevelUpdate = useCallback((level: AudioLevelData) => {
    setAudioLevel(level);
  }, []);

  const initializeAudio = async () => {
    if (!audioCapture.current) return false;
    
    try {
      setIsInitializing(true);
      setError(null);
      await audioCapture.current.initialize();
      audioCapture.current.setLevelCallback(handleLevelUpdate);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMsg);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  const startRecording = async () => {
    if (!audioCapture.current) return;

    const initialized = await initializeAudio();
    if (!initialized) return;

    try {
      audioCapture.current.startRecording();
      setRecording(true);
      setTranscript("");
      setError(null);
      window.app.startRecording();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMsg);
    }
  };

  const stopRecording = async () => {
    if (!audioCapture.current) return;

    try {
      const pcmData = audioCapture.current.stopRecording();
      setAudioLevel({ rms: 0, peak: 0, timestamp: 0 });
      
      // Send PCM data to main process for transcription
      await window.app.stopRecording(pcmData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMsg);
      setRecording(false);
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      toggleRecording();
    } else if (event.code === 'Escape' && recording) {
      event.preventDefault();
      setRecording(false);
      setAudioLevel({ rms: 0, peak: 0, timestamp: 0 });
      if (audioCapture.current) {
        audioCapture.current.dispose();
        audioCapture.current = new AudioCapture({
          sampleRate: 16000,
          channels: 1,
          bufferSize: 2048
        });
      }
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div 
      className="bubble" 
      ref={bubbleRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="mic-container">
        <button
          onClick={toggleRecording}
          disabled={isInitializing}
          className={`mic-button ${recording ? 'recording' : 'idle'} ${isInitializing ? 'initializing' : ''}`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          {!recording && !isInitializing && '🎤'}
          {isInitializing && '⏳'}
        </button>
        
        {recording && (
          <div className="audio-visualizer">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="audio-bar"
                style={{
                  height: `${Math.max(10, audioLevel.rms * (0.8 + i * 0.4))}%`,
                  opacity: audioLevel.rms > 5 ? 1 : 0.3
                }}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={clearError} className="error-close">×</button>
          {error.includes('microphone') && (
            <button onClick={initializeAudio} className="retry-button">
              Retry
            </button>
          )}
        </div>
      )}

      {transcript && (
        <div className="transcript-bubble">
          <div className="transcript-content" title="Click to select text">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
}

export default Bubble;
