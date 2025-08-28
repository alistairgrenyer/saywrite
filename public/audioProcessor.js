/**
 * AudioWorklet processor for real-time audio capture
 * Replaces deprecated ScriptProcessorNode
 */
class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.bufferSize = options.processorOptions?.bufferSize || 2048;
    this.isRecording = false;
    
    this.port.onmessage = (event) => {
      if (event.data.type === 'startRecording') {
        this.isRecording = true;
      } else if (event.data.type === 'stopRecording') {
        this.isRecording = false;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input && input.length > 0 && this.isRecording) {
      const inputChannel = input[0];
      
      // Send audio data back to main thread
      this.port.postMessage({
        type: 'audioData',
        buffer: inputChannel.buffer.slice()
      });
    }

    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
