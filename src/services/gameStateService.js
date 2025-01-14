class GameStateService {
    constructor() {
        this.ws = null;
    }

    async saveGameState(ws, userId, gameState) {
        try {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.error('WebSocket not connected');
                return;
            }

            const message = {
                action: 'save_game_state',
                userId,
                gameState
            };

            ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    async getGameState(ws, userId) {
        try {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.error('WebSocket not connected');
                return null;
            }

            const message = {
                action: 'get_game_state',
                userId
            };

            ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('Error getting game state:', error);
            return null;
        }
    }

    async updateScore(ws, userId, daysToASI) {
        try {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.error('WebSocket not connected');
                return;
            }

            const message = {
                action: 'update_score',
                userId,
                daysToASI
            };

            ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('Error updating score:', error);
        }
    }
}

export const gameStateService = new GameStateService();