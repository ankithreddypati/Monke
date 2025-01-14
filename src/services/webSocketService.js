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
    if (this.isConnecting || this.ws) {
      console.log('Connection already exists or in progress');
      return this.ws;
    }

    if (!userId) {
      throw new Error('userId is required');
    }

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

      console.log('Connecting to WebSocket:', wsUrl.toString());
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
          console.log('WebSocket message received:', data);
          this.connectionInfo.callback(data);
        } catch (error) {
          console.error('Error parsing message:', error);
          this.connectionInfo.callback(event);
        }
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.cleanup();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  cleanup() {
    if (this.ws) {
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      
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
      console.error('WebSocket not connected, state:', this.ws?.readyState);
      return;
    }

    const message = {
      type: 'game_stats',
      data: {
        type: 'game_completed',
        daysToComplete: parseInt(daysToComplete),
        username,
        timestamp: Date.now()
      }
    };

    try {
      console.log('Sending game completion:', message);
      await this.sendMessage(message);
      console.log('Game completion sent successfully');
    } catch (error) {
      console.error('Failed to send game completion:', error);
      throw error; // Propagate error to caller
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
      const state = this.ws?.readyState;
      const stateMap = {
        0: 'CONNECTING',
        1: 'OPEN',
        2: 'CLOSING',
        3: 'CLOSED'
      };
      console.error('WebSocket not connected, current state:', stateMap[state] || 'NO_CONNECTION');
      throw new Error(`WebSocket not connected (${stateMap[state] || 'NO_CONNECTION'})`);
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      console.log('Sending WebSocket message:', messageString);
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
    const connected = this.ws?.readyState === WebSocket.OPEN;
    console.log('WebSocket connection status:', connected ? 'CONNECTED' : 'NOT_CONNECTED');
    return connected;
  }
}

export const websocketService = new WebSocketService();