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

            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    autoGainControl: true,
                    echoCancellation: false,
                    noiseSuppression: false
                }
            });

            this.audioContext = new AudioContext({
                sampleRate: 16000,
                latencyHint: 'interactive'
            });

            this.audioInput = this.audioContext.createMediaStreamSource(this.stream);
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 2.5;

            const workletContent = `
                class AudioProcessor extends AudioWorkletProcessor {
                    constructor() {
                        super();
                        this.sampleCount = 0;
                        this.silenceThreshold = 0.001;
                        this.bufferSize = 4096; // Fixed buffer size
                    }

                    process(inputs, outputs, parameters) {
                        const input = inputs[0];
                        if (!input || !input[0]) return true;
                        
                        const channel = input[0];
                        if (channel.length === 0) return true;
                        
                        const audioData = new Int16Array(channel.length);
                        
                        let maxLevel = 0;
                        
                        for (let i = 0; i < channel.length; i++) {
                            const sample = channel[i];
                            maxLevel = Math.max(maxLevel, Math.abs(sample));
                            audioData[i] = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
                        }
                        
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

            this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
            
            this.workletNode.port.onmessage = (event) => {
                const { buffer } = event.data;
                const pcmData = new Int16Array(buffer);
                
                // Check buffer size before adding
                if (this.getTotalBufferSize() + pcmData.length * 2 <= this.maxBufferSize) {
                    this.audioBuffer.push(pcmData);
                } else {
                    this.flushBuffer();
                }
            };

            this.audioInput.connect(this.gainNode);
            this.gainNode.connect(this.workletNode);
            
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
                const totalLength = this.audioBuffer.reduce((total, chunk) => total + chunk.length, 0);
                const combinedBuffer = new Int16Array(totalLength);
                let offset = 0;

                this.audioBuffer.forEach(chunk => {
                    combinedBuffer.set(chunk, offset);
                    offset += chunk.length;
                });

                const base64Data = this.int16ArrayToBase64(combinedBuffer);
                this.onDataCallback({
                    type: 'audio_data',
                    data: base64Data,
                    timestamp: Date.now()
                });

                // Clear buffer after sending
                this.audioBuffer = [];
            } catch (error) {
                console.error('Error flushing buffer:', error);
                this.audioBuffer = []; // Clear buffer on error
            }
        }
    }

    stopRecording() {
        if (!this.isRecording) return;

        try {
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

    int16ArrayToBase64(int16Array) {
        // Create a buffer view directly
        const uint8Array = new Uint8Array(int16Array.buffer);
        const binaryString = String.fromCharCode.apply(null, uint8Array);
        return btoa(binaryString);
    }

    get isActive() {
        return this.isRecording;
    }
}

export const audioRecorderService = new AudioRecorderService();