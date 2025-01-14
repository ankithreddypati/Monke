import React, { useState, useEffect } from "react";
import { Html } from "@react-three/drei";
import { Vector3 } from "three";

const INTERACTION_DISTANCE = 3;
const KEYPAD_POSITION = new Vector3(32, 36, -163);

const KeypadOverlay = ({ playerRef, onCorrectCode }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [code, setCode] = useState('');
  const [showError, setShowError] = useState(false);
  const correctCode = '1337';

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === "KeyF" && showPrompt && !isActive) {
        event.preventDefault();
        setIsActive(true);
        return;
      }

      // Handle number inputs when keypad is active
      if (isActive) {
        if (/^\d$/.test(event.key)) {
          setCode(prevCode => {
            const newCode = (prevCode + event.key).slice(0, 4);
            if (newCode.length === 4) {
              if (newCode === correctCode) {
                onCorrectCode();
                setTimeout(() => {
                  setCode('');
                  setIsActive(false);
                }, 500);
              } else {
                setShowError(true);
                setTimeout(() => {
                  setShowError(false);
                  setCode('');
                }, 1000);
              }
            }
            return newCode;
          });
        } else if (event.key === 'Escape') {
          setIsActive(false);
          setCode('');
          setShowError(false);
        } else if (event.key === 'Backspace') {
          setCode(prevCode => prevCode.slice(0, -1));
          setShowError(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showPrompt, isActive, onCorrectCode]);

  useEffect(() => {
    const checkDistance = () => {
      if (!playerRef.current) return;

      const playerPosition = playerRef.current.translation();
      const playerVec = new Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
      const distance = playerVec.distanceTo(KEYPAD_POSITION);
      const withinRange = distance < INTERACTION_DISTANCE;

      if (!withinRange && isActive) {
        setIsActive(false);
        setCode('');
        setShowError(false);
      }
      setShowPrompt(withinRange && !isActive);
    };

    const interval = setInterval(checkDistance, 100);
    return () => clearInterval(interval);
  }, [playerRef, isActive]);

  return (
    <>
      {showPrompt && (
        <Html position={[KEYPAD_POSITION.x, KEYPAD_POSITION.y + 2, KEYPAD_POSITION.z]} center>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              borderRadius: '8px',
              fontSize: '18px',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            Press F to access keypad
          </div>
        </Html>
      )}

      {isActive && (
        <Html
          position={[KEYPAD_POSITION.x, KEYPAD_POSITION.y + 2, KEYPAD_POSITION.z]}
          center
        >
          <div style={{
            padding: '24px',
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: '2px solid #333',
            borderRadius: '12px',
            width: '300px'
          }}>
            <h2 style={{
              color: '#fff',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>Security Keypad</h2>
            <div style={{
              backgroundColor: '#000',
              color: showError ? '#ff0000' : '#0f0',
              padding: '1rem',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '2rem',
              textAlign: 'center',
              marginBottom: '1rem',
              letterSpacing: '0.5rem',
              transition: 'color 0.2s ease'
            }}>
              {showError ? 'ERROR' : code.padEnd(4, '•')}
            </div>
            <p style={{
              color: '#666',
              textAlign: 'center',
              fontSize: '0.875rem',
              marginTop: '12px'
            }}>
              Enter code using number keys<br/>
              Press ESC to cancel
            </p>
          </div>
        </Html>
      )}
    </>
  );
};

export default KeypadOverlay;