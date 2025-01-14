// src/services/gameService.js
import { fetchAuthSession } from 'aws-amplify/auth';

class GameService {
  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL;
  }

  async getAuthHeaders() {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      throw error;
    }
  }

  async getLeaderboard() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiUrl}/leaderboard`, { headers });
      const data = await response.json();
      return data.leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  async saveGameCompletion(score) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiUrl}/completion`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ daysToComplete: score })
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving game completion:', error);
      throw error;
    }
  }

  async updateProgress(level, daysSpent) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiUrl}/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          level, 
          daysSpent 
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }
}

export const gameService = new GameService();