import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { HostedApiClient } from '../adapters/api/HostedApiClient.js'
import { RewriteRequest } from '../core/models/rewrite.js'
import './FloatingBubble.css'

const apiClient = new HostedApiClient()

type RecordingState = 'idle' | 'recording' | 'processing' | 'transcribing' | 'rewriting'

interface FloatingBubbleProps {
  onLoginRequired: () => void
}

export function FloatingBubble({ onLoginRequired }: FloatingBubbleProps) {
  const { authState } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [transcript, setTranscript] = useState('')
  const [rewrittenText, setRewrittenText] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    if (!authState.authenticated) {
      onLoginRequired()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecordingState('recording')
      setRecordingTime(0)
      setTranscript('')
      setRewrittenText('')
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
      setRecordingState('processing')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setRecordingState('transcribing')
    
    try {
      // Call actual transcription API
      const transcribeResponse = await apiClient.transcribe(audioBlob)
      setTranscript(transcribeResponse.text)
      setRecordingState('rewriting')
      
      // Now rewrite the transcript
      const request: RewriteRequest = {
        transcript: transcribeResponse.text,
        profile: {
          id: "professional-profile",
          name: "Professional",
          tone: "professional",
          constraints: ["clear", "concise"],
          format: "email",
          audience: "business",
          glossary: {},
          max_words: 350
        },
        options: {
          temperature: 0.5,
          provider_hint: "openai"
        }
      }

      const rewriteResponse = await apiClient.rewrite(request)
      setRewrittenText(rewriteResponse.draft)
      setRecordingState('idle')
      
    } catch (error) {
      console.error('Error processing audio:', error)
      setRecordingState('idle')
      alert('Error processing audio. Please try again.')
    }
  }

  const resetBubble = () => {
    setIsExpanded(false)
    setRecordingState('idle')
    setTranscript('')
    setRewrittenText('')
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStateIcon = () => {
    switch (recordingState) {
      case 'recording':
        return '🔴'
      case 'processing':
      case 'transcribing':
        return '⏳'
      case 'rewriting':
        return '✨'
      default:
        return '🎤'
    }
  }

  const getStateText = () => {
    switch (recordingState) {
      case 'recording':
        return `Recording... ${formatTime(recordingTime)}`
      case 'processing':
        return 'Processing audio...'
      case 'transcribing':
        return 'Transcribing...'
      case 'rewriting':
        return 'Rewriting...'
      default:
        return 'Tap to start recording'
    }
  }

  return (
    <div className={`floating-bubble ${isExpanded ? 'expanded' : ''}`}>
      {!isExpanded ? (
        <button 
          className="bubble-trigger"
          onClick={() => setIsExpanded(true)}
          disabled={recordingState !== 'idle'}
        >
          {getStateIcon()}
        </button>
      ) : (
        <div className="bubble-content">
          <div className="bubble-header">
            <h3>SayWrite</h3>
            <button 
              className="close-button"
              onClick={resetBubble}
              disabled={recordingState === 'recording'}
            >
              ×
            </button>
          </div>

          <div className="recording-section">
            <button
              className={`record-button ${recordingState}`}
              onClick={recordingState === 'recording' ? stopRecording : startRecording}
              disabled={recordingState === 'processing' || recordingState === 'transcribing' || recordingState === 'rewriting'}
            >
              <span className="record-icon">{getStateIcon()}</span>
            </button>
            <p className="state-text">{getStateText()}</p>
          </div>

          {transcript && (
            <div className="transcript-section">
              <h4>Transcription:</h4>
              <div className="transcript-text">{transcript}</div>
            </div>
          )}

          {rewrittenText && (
            <div className="rewritten-section">
              <h4>Rewritten:</h4>
              <div className="rewritten-text">{rewrittenText}</div>
              <button 
                className="copy-button"
                onClick={() => navigator.clipboard.writeText(rewrittenText)}
              >
                Copy to Clipboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
