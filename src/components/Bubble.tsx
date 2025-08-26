import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioCapture, AudioLevelData } from '../utils/audioCapture';
import { DraggableBubble } from './DraggableBubble';
import { TranscriptWindow } from './TranscriptWindow';
import './Bubble.css';

function Bubble() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState<AudioLevelData>({ rms: 0, peak: 0, timestamp: 0 });
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingSize, setRecordingSize] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [finalRecordingDuration, setFinalRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [bubblePosition, setBubblePosition] = useState({ x: 100, y: 100 });
  
  const audioCapture = useRef<AudioCapture | null>(null);
  const recordingStartTime = useRef<number>(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

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
      setIsProcessing(false);
      setAudioLevel({ rms: 0, peak: 0, timestamp: 0 });
      // Don't reset recording duration/size here - keep for playback
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    });

    window.app.onSTTError((errorMsg) => {
      setError(errorMsg);
      setRecording(false);
      setIsProcessing(false);
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
      // Clear all previous state before starting new recording
      setTranscript("");
      setAudioData(null);
      setFinalRecordingDuration(0);
      setError(null);
      setRecordingDuration(0);
      setRecordingSize(0);
      setIsProcessing(false);
      
      audioCapture.current.startRecording();
      setRecording(true);
      recordingStartTime.current = Date.now();
      
      // Start duration timer
      durationInterval.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTime.current) / 1000;
        setRecordingDuration(elapsed);
        // Estimate size: 16kHz * 2 bytes * 1 channel * elapsed seconds
        setRecordingSize(Math.floor(elapsed * 16000 * 2));
      }, 100);
      
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
      setRecording(false); // Set recording to false immediately for UI feedback
      setAudioLevel({ rms: 0, peak: 0, timestamp: 0 });
      
      // Store final duration and convert Float32Array to ArrayBuffer for playback
      setFinalRecordingDuration(recordingDuration);
      // Convert Float32Array to Int16Array (16-bit PCM) for proper audio playback
      const int16Data = new Int16Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        // Convert from float (-1 to 1) to 16-bit signed integer
        const sample = Math.max(-1, Math.min(1, pcmData[i]));
        int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }
      setAudioData(int16Data.buffer.slice(0));
      
      // Clear duration timer
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      
      // Show processing state
      setIsProcessing(true);
      
      // Send original Float32Array data to main process for transcription
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

  const handlePositionChange = useCallback((position: { x: number; y: number }) => {
    setBubblePosition(position);
  }, []);

  const closeTranscript = () => {
    setTranscript("");
    setAudioData(null);
    setFinalRecordingDuration(0);
  };

  return (
    <>
      <div 
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          outline: 'none'
        }}
      >
        <DraggableBubble
          recording={recording}
          isInitializing={isInitializing}
          onToggleRecording={toggleRecording}
          position={bubblePosition}
          onPositionChange={handlePositionChange}
          audioLevel={audioLevel}
          recordingDuration={recordingDuration}
          recordingSize={recordingSize}
        />
      </div>

      {error && (
        <div className="error-message" style={{
          position: 'fixed',
          top: bubblePosition.y + 140,
          left: bubblePosition.x,
          zIndex: 1002
        }}>
          <span>{error}</span>
          <button onClick={clearError} className="error-close">×</button>
          {error.includes('microphone') && (
            <button onClick={initializeAudio} className="retry-button">
              Retry
            </button>
          )}
        </div>
      )}

      {(transcript || isProcessing) && (
        <TranscriptWindow
          text={transcript}
          isProcessing={isProcessing}
          position={{
            x: bubblePosition.x,
            y: bubblePosition.y + 140
          }}
          onClose={closeTranscript}
          audioData={audioData || undefined}
          recordingDuration={finalRecordingDuration}
        />
      )}
    </>
  );
}

export default Bubble;
