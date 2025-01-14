import React, { useState, useEffect } from 'react';
import { Trophy, Calendar } from "lucide-react";
import { websocketService } from '../services/webSocketService';
import { Html } from '@react-three/drei';

const GameCompletionOverlay = ({ score, onRestart, user }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    const initializeLeaderboard = async () => {
      try {
        if (!websocketService.isConnected || !websocketService.ws?.readyState === WebSocket.OPEN) {
          console.log('WebSocket not ready, skipping leaderboard initialization');
          return;
        }

        if (user?.username) {
          console.log('Sending game completion data...');
          websocketService.sendMessage({
            type: 'game_stats',
            data: {
              type: 'game_completed',
              username: user.username,
              daysToComplete: score
            }
          });
        }

        console.log('Requesting leaderboard data...');
        websocketService.sendMessage({
          type: 'request_leaderboard',
          data: { gameType: 'main_game' }
        });
      } catch (error) {
        console.error('Error initializing leaderboard:', error);
      }
    };

    initializeLeaderboard();
  }, [user, score]);

  useEffect(() => {
    let mounted = true;
    const messageHandler = (event) => {
      if (!mounted) return;
      
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'leaderboard_update') {
          console.log('Received leaderboard update:', message.data);
          setLeaderboardData(message.data.leaderboard || []);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    if (websocketService.isConnected && websocketService.ws?.readyState === WebSocket.OPEN) {
      console.log('Adding WebSocket message listener');
      websocketService.ws.addEventListener('message', messageHandler);
    } else {
      console.log('WebSocket not ready, skipping listener setup');
    }

    return () => {
      mounted = false;
      if (websocketService.ws?.readyState === WebSocket.OPEN) {
        websocketService.ws.removeEventListener('message', messageHandler);
      }
    };
  }, []);

  return (
    <Html fullscreen>
      <div 
        style={{
          width: '90vw',
          height: '90vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          marginTop: '300px',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          fontFamily: '"Press Start 2P", system-ui, -apple-system, sans-serif'
        }}
      >
        <div style={{ 
          display: 'flex', 
          gap: '2rem', 
          maxWidth: '1200px', 
          width: '90%' 
        }}>
          {/* Victory Card */}
          <div style={{
            flex: '1',
            background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(20, 20, 20, 0.95))',
            padding: '3rem',
            borderRadius: '15px',
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 165, 0, 0.3)',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            color: '#fff',
            animation: 'fadeIn 0.5s ease-out',
            textAlign: 'center'
          }}>
            <Trophy size={64} color="#FFD700" style={{ marginBottom: '1.5rem' }} />
            
            <h1 style={{
              fontSize: '3rem',
              fontFamily: '"Press Start 2P", system-ui, -apple-system, sans-serif',
              color: '#FFD700',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5), 2px 2px 0px #ff4800',
              letterSpacing: '2px',
              lineHeight: '1.4',
              marginBottom: '2rem',
              animation: 'pulse 2s infinite'
            }}>
              CONGRATULATIONS
            </h1>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2rem',
              borderRadius: '8px',
              marginBottom: '2rem',
              border: '1px solid rgba(255, 165, 0, 0.3)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <Calendar size={24} color="#FFD700" />
                <span style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#FFD700'
                }}>
                  {score} Days
                </span>
              </div>
              <p style={{
                fontSize: '1.1rem',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                You've Done it
              </p>
            </div>
            
            <button
              onClick={onRestart}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                background: isHovered ? 
                  'linear-gradient(145deg, #FFD700, #FFA500)' : 
                  'linear-gradient(145deg, #FFA500, #FF8C00)',
                padding: '1rem 2rem',
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginTop: '1rem',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
              }}
            >
              Play Again
            </button>
          </div>

          {/* Leaderboard Card */}
          <div style={{
            flex: '0.5',
            minWidth: '300px',
            background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(20, 20, 20, 0.95))',
            padding: '2rem',
            borderRadius: '15px',
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 165, 0, 0.3)',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            color: '#fff',
            animation: 'fadeIn 0.5s ease-out',
            height: 'fit-content'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#FFD700',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              Leaderboard
            </h2>
            
            {leaderboardData?.length > 0 ? (
              leaderboardData.map((entry, index) => (
                <div
                  key={entry.userId || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: entry.username === user?.username ? 
                      'rgba(255, 215, 0, 0.1)' : 
                      'rgba(255, 255, 255, 0.05)',
                    marginBottom: '0.5rem',
                    border: entry.username === user?.username ? 
                      '1px solid rgba(255, 215, 0, 0.3)' : 
                      '1px solid transparent'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <span style={{
                      color: index < 3 ? '#FFD700' : '#fff',
                      fontWeight: 'bold'
                    }}>
                      #{index + 1}
                    </span>
                    <span>{entry.username}</span>
                  </div>
                  <span>{entry.daysToComplete} days</span>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Loading leaderboard...
              </div>
            )}
          </div>
        </div>

        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
          `}
        </style>
      </div>
    </Html>
  );
};

export default GameCompletionOverlay;