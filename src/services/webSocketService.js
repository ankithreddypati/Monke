// src/services/webSocketService.js
import { fetchAuthSession } from 'aws-amplify/auth';
import awsConfig from '../config/aws-config';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnecting = false;
    this.connectionInfo = {
      userId: null,
      isGuest: false,
      callback: null,
    };
  }

  async connect(onMessage, userId, isGuest = false) {
    // Prevent multiple connection attempts
    if (this.isConnecting || this.ws) {
      console.log('Connection already exists or in progress');
      return this.ws;
    }

    if (!userId) {
      throw new Error('userId is required');
    }

    // Store connection info
    this.connectionInfo = { userId, isGuest, callback: onMessage };
    this.isConnecting = true;

    try {
      const wsUrl = new URL(awsConfig.apiUrl);
      wsUrl.protocol = wsUrl.protocol.replace('http', 'ws');
      wsUrl.searchParams.append('userId', userId);

      if (isGuest) {
        wsUrl.searchParams.append('guest', 'true');
      } else {
        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.idToken?.toString();
          if (!token) throw new Error('No valid token found');
          wsUrl.searchParams.append('token', token);
        } catch (error) {
          console.error('Auth session error:', error);
          this.isConnecting = false;
          throw new Error('Authentication failed');
        }
      }

      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl.toString());
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.cleanup();
          reject(new Error('Connection timeout'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('WebSocket connected successfully for:', userId, isGuest ? '(Guest)' : '(Authenticated)');
          this.isConnecting = false;
          this.setupWebSocketHandlers();
          resolve(this.ws);
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('WebSocket connection error:', error);
          this.cleanup();
          reject(error);
        };
      });

    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      if (this.connectionInfo.callback) {
        try {
          const data = JSON.parse(event.data);
          this.connectionInfo.callback(data);
        } catch (error) {
          console.error('Error parsing message:', error);
          this.connectionInfo.callback(event);
        }
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code);
      this.cleanup();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  cleanup() {
    if (this.ws) {
      // Remove all listeners before closing
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      
      // Close the connection
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Normal closure');
      }
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.connectionInfo = { userId: null, isGuest: false, callback: null };
  }

  async sendGameCompletion(daysToComplete, username) {
    if (!this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    const message = {
      type: 'game_stats',
      data: {
        type: 'game_completed',
        daysToComplete,
        username,
        timestamp: Date.now()
      }
    };

    try {
      await this.sendMessage(message);
    } catch (error) {
      console.error('Failed to send game completion:', error);
    }
  }

  

  async sendAudioMessage(audioData, gameState, userId, gameId) {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    const maxChunkSize = 24000;
    const totalChunks = Math.ceil(audioData.length / maxChunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * maxChunkSize;
      const end = Math.min(start + maxChunkSize, audioData.length);
      const chunk = audioData.slice(start, end);
      
      const message = {
        type: 'audio_data',
        data: {
          data: chunk,
          timestamp: Date.now(),
          chunkIndex: i,
          totalChunks: totalChunks
        },
        gameState: {
          ...gameState,
          timestamp: Date.now()
        },
        userId,
        gameId,
        isGuest: this.connectionInfo.isGuest
      };

      try {
        await this.sendMessage(message);
      } catch (error) {
        console.error(`Failed to send audio chunk ${i + 1}:`, error);
        throw error;
      }
    }
  }

  sendMessage(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(messageString);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  disconnect() {
    console.log('Disconnecting WebSocket...');
    this.cleanup();
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();