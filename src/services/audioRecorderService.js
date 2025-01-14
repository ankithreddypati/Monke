class AudioRecorderService {
    constructor() {
      this.mediaRecorder = null;
      this.isRecording = false;
      this.stream = null;
      this.audioContext = null;
      this.audioInput = null;
      this.workletNode = null;
      this.gainNode = null;
      this.onDataCallback = null;
      this.hasPermission = false;
      this.audioBuffer = [];
      this.maxBufferSize = 1024 * 1024; // 1MB buffer limit
    }
  
    async checkPermissions() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        this.hasPermission = true;
        return true;
      } catch (error) {
        console.error('Microphone permission check failed:', error);
        this.hasPermission = false;
        return false;
      }
    }
  
    async startRecording(onDataCallback) {
      if (this.isRecording) {
        console.warn('Already recording');
        return false;
      }
  
      try {
        if (!this.hasPermission) {
          const permitted = await this.checkPermissions();
          if (!permitted) {
            throw new Error('Microphone permission required');
          }
        }
  
        this.audioBuffer = [];
  
        // Request mic at 16k
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            autoGainControl: true,
            echoCancellation: false,
            noiseSuppression: false
          }
        });
  
        // Create AudioContext at 16k sample rate
        this.audioContext = new AudioContext({
          sampleRate: 16000,
          latencyHint: 'interactive'
        });
  
        this.audioInput = this.audioContext.createMediaStreamSource(this.stream);
        this.gainNode = this.audioContext.createGain();
        // Adjust gain if needed
        this.gainNode.gain.value = 2.5;
  
        // Add AudioWorklet with inline content
        const workletContent = `
          class AudioProcessor extends AudioWorkletProcessor {
            constructor() {
              super();
              this.sampleCount = 0;
              this.silenceThreshold = 0.001;
              this.bufferSize = 4096;
            }
  
            process(inputs, outputs, parameters) {
              const input = inputs[0];
              if (!input || !input[0]) return true;
              
              const channel = input[0];
              if (channel.length === 0) return true;
              
              // Convert float samples to 16-bit PCM
              const audioData = new Int16Array(channel.length);
              let maxLevel = 0;
              
              for (let i = 0; i < channel.length; i++) {
                const sample = channel[i];
                maxLevel = Math.max(maxLevel, Math.abs(sample));
                // clamp and convert to int16
                audioData[i] = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
              }
              
              // Only send data if above silence threshold
              if (maxLevel > this.silenceThreshold) {
                this.port.postMessage({
                  buffer: audioData.buffer,
                  maxLevel: maxLevel
                }, [audioData.buffer]);
              }
              
              return true;
            }
          }
          registerProcessor('audio-processor', AudioProcessor);
        `;
  
        await this.audioContext.audioWorklet.addModule(
          'data:text/javascript,' + encodeURIComponent(workletContent)
        );
  
        // Create a node from our processor
        this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
        this.workletNode.port.onmessage = (event) => {
          const { buffer } = event.data;
          const pcmData = new Int16Array(buffer);
  
          // Check current total buffer size
          if (this.getTotalBufferSize() + pcmData.length * 2 <= this.maxBufferSize) {
            this.audioBuffer.push(pcmData);
          } else {
            // If we exceed max buffer, flush to callback
            this.flushBuffer();
          }
        };
  
        // Connect all nodes
        this.audioInput.connect(this.gainNode);
        this.gainNode.connect(this.workletNode);
  
        // Save callback
        this.onDataCallback = onDataCallback;
        this.isRecording = true;
  
        console.log('Recording started with sample rate:', this.audioContext.sampleRate);
        return true;
      } catch (error) {
        console.error('Error starting recording:', error);
        this.cleanup();
        throw error;
      }
    }
  
    getTotalBufferSize() {
      return this.audioBuffer.reduce((total, chunk) => total + chunk.length * 2, 0);
    }
  
    flushBuffer() {
      if (this.audioBuffer.length > 0 && this.onDataCallback) {
        try {
          const totalLength = this.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
          const combinedBuffer = new Int16Array(totalLength);
          let offset = 0;
  
          this.audioBuffer.forEach(chunk => {
            combinedBuffer.set(chunk, offset);
            offset += chunk.length;
          });
  
          // Chunked base64 encoding to prevent call stack errors
          const base64Data = this.int16ArrayToBase64(combinedBuffer);
  
          // Send to callback
          this.onDataCallback({
            type: 'audio_data',
            data: base64Data,
            timestamp: Date.now()
          });
  
          // Clear local buffer
          this.audioBuffer = [];
        } catch (error) {
          console.error('Error flushing buffer:', error);
          // In any error, clear
          this.audioBuffer = [];
        }
      }
    }
  
    stopRecording() {
      if (!this.isRecording) return;
  
      try {
        // Flush final data to callback
        this.flushBuffer();
        this.cleanup();
        console.log('Recording stopped');
      } catch (error) {
        console.error('Error stopping recording:', error);
        this.cleanup();
      }
    }
  
    cleanup() {
      this.isRecording = false;
      this.audioBuffer = [];
      this.onDataCallback = null;
  
      if (this.workletNode) {
        this.workletNode.disconnect();
        this.workletNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.audioInput) {
        this.audioInput.disconnect();
        this.audioInput = null;
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    }
  
    // This method is the main fix for "Maximum call stack size exceeded" 
    int16ArrayToBase64(int16Array) {
      const uint8Array = new Uint8Array(int16Array.buffer);
      const chunkSize = 8192; // 8KB typical
      let result = "";
  
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        // .apply() is safe for small chunks
        result += String.fromCharCode.apply(null, chunk);
      }
  
      return btoa(result);
    }
  
    get isActive() {
      return this.isRecording;
    }
  }
  
  export const audioRecorderService = new AudioRecorderService();
  