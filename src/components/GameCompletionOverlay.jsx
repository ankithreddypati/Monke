import React, { useState, useEffect } from 'react';
import { Trophy, Calendar } from "lucide-react";
import { websocketService } from '../services/webSocketService';
import { Html } from '@react-three/drei';

const GameCompletionOverlay = ({ score, onRestart, user }) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (user?.username && websocketService.isConnected) {
      websocketService.sendMessage({
        type: 'game_stats',
        data: {
          type: 'game_completed',
          username: user.username,
          daysToComplete: score
        }
      });
    }
  }, []);

  return (
    <Html fullscreen>
      <div 
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          fontFamily: '"Cinzel", serif'
        }}
      >
        <div style={{
          background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(20, 20, 20, 0.95))',
          padding: '3rem',
          borderRadius: '15px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 165, 0, 0.3)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          color: '#fff',
          animation: 'fadeIn 0.5s ease-out',
          textAlign: 'center'
        }}>
          <Trophy size={64} color="#FFD700" style={{ marginBottom: '1.5rem' }} />
          
          <h1 style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            color: '#FFD700',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            letterSpacing: '4px',
            marginBottom: '2rem'
          }}>
            VICTORY!
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
              You've completed all levels!
            </p>
          </div>

          {/* <button
            onClick={onRestart}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: isHovered ? '#FFD700' : '#FFA500',
              color: isHovered ? '#000' : '#fff',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: 'all 0.3s ease',
              boxShadow: isHovered ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none'
            }}
          >
            Start New Adventure
          </button> */}
        </div>

        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
            
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
      </div>
    </Html>
  );
};

export default GameCompletionOverlay;