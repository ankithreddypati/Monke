import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { audioManager } from '../services/AudioManager';
import { Volume2, VolumeX, LogOut, HelpCircle } from 'lucide-react';


export function GameUI({ onSignOut, user }) {
  const { energy, score, gameState, currentLevel } = useGame();
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const baseStyles = {
    fontFamily: "'Press Start 2P', system-ui, -apple-system, sans-serif",
    letterSpacing: '0.5px'
  };

  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    audioManager.sounds.forEach((sound) => {
        sound.muted = newMuteState;
    });
};

  return (
    <>
      {/* HUD */}
      <div style={{
        ...baseStyles,
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '10px',
        zIndex: 10,
        minWidth: '200px'
      }}>
        {/* User Info and Help Button Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
          position: 'relative'
        }}>
          {/* Username Box */}
          <div style={{
            flex: 1,
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '5px 10px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '2px solid #ffffff',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {`Monke ${user?.username || 'Guest Monke'}`}
          </div>

          {/* Help Button */}
          <button
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #ffffff',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={20} color="white" />
          </button>

          {/* Controls Tooltip */}
          {showControls && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '10px',
              padding: '15px',
              background: 'rgba(0, 0, 0, 0.8)',
              border: '2px solid #ffffff',
              borderRadius: '10px',
              color: 'white',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              zIndex: 20
            }}>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Controls:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>WASD - Move</div>
                <div>SPACE - Jump</div>
                <div>SHIFT - Run</div>
              </div>
            </div>
          )}
        </div>

        {/* Level and Day Counter Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          {/* Level */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            <span style={{
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              Level
            </span>
            <div style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '5px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #ffffff',
              borderRadius: '8px'
            }}>
              {currentLevel}
            </div>
          </div>

          {/* Day Counter */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            <span style={{
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              Day
            </span>
            <div style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '5px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #ffffff',
              borderRadius: '8px'
            }}>
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Energy Bar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <span style={{
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            Energy
          </span>
          <div style={{
            width: '100%',
            height: '20px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '2px solid #ffffff',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${energy}%`,
              height: '100%',
              background: energy < 30 ? '#ef4444' : '#eab308',
              transition: 'all 0.3s ease'
            }}/>
          </div>
        </div>

        {/* Controls Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          {/* Audio Mute Button */}
          <button
            onClick={handleMuteToggle}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isMuted ? 
              <VolumeX size={24} color="white" /> : 
              <Volume2 size={24} color="white" />
            }
          </button>

          {/* Sign Out Button */}
          <button
            onClick={onSignOut}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: '8px',
              background: 'rgba(239, 68, 68, 0.6)',
              border: '2px solid #ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={24} color="white" />
          </button>
        </div>
      </div>

      {/* Game Over Message */}
      {gameState === 'game-over' && (
        <div style={{
          ...baseStyles,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ef4444',
          fontSize: '48px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          zIndex: 100,
        }}>
          You Ded
        </div>
      )}
    </>
  );
}