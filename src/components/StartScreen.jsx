
// StartScreen.jsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';

export const StartScreen = ({ onStart }) => {
  const [mode, setMode] = useState('signin');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    code: ''
  });
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const user = await authService.signIn(formData.username, formData.password);
      
      // Create a proper user object using the response from authService
      const authenticatedUser = {
        username: user.username,
        isGuest: false,
        isSignedIn: true
      };
      
      console.log('Authentication successful:', authenticatedUser);
      onStart(formData.username, authenticatedUser);
    } catch (error) {
      if (error.message.includes('User is not confirmed')) {
        setMode('verify');
        setError('Please verify your email first');
      } else {
        setError(error.message || 'Sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.signUp(
        formData.username,
        formData.email,
        formData.password
      );
      setMode('verify');
      setError('Check your email for verification code!');
    } catch (error) {
      setError(error.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.confirmSignUp(formData.username, formData.code);
      setMode('signin');
      setError('Email verified! Please sign in.');
      setFormData(prev => ({ ...prev, password: '', code: '' }));
    } catch (error) {
      setError(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await authService.resendCode(formData.username);
      setError('New verification code sent!');
    } catch (error) {
      setError(error.message || 'Failed to resend code');
    }
  };

  const handleGuestLogin = () => {
    const guestId = `Guest_${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
    const guestUser = { 
      username: guestId,
      isGuest: true,
      isSignedIn: true
    };
    console.log('Guest Login:', guestUser);
    onStart(guestId, guestUser);
  };



  const commonInputStyle = {
    width: '100%',
    padding: '1rem',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '2px solid rgba(255, 165, 0, 0.3)',
    background: 'rgba(0, 0, 0, 0.3)',
    color: '#fff',
    fontSize: '1.1rem',
    transition: 'all 0.3s ease',
    outline: 'none'
  };

  const commonButtonStyle = {
    width: '100%',
    padding: '1rem',
    backgroundColor: loading ? 'rgba(128, 128, 128, 0.3)' : 
      isHovered ? '#FFD700' : '#FFA500',
    color: isHovered ? '#000' : '#fff',
    borderRadius: '8px',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    transition: 'all 0.3s ease',
    boxShadow: isHovered ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none'
  };

  const renderPasswordInput = () => (
    <div style={{ position: 'relative', marginBottom: '1rem', width: '100%' }}>
      <input
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleInputChange}
        style={{
          ...commonInputStyle,
          marginBottom: 0,
          paddingRight: '2.5rem',
          width: '100%',
          boxSizing: 'border-box'
        }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255, 255, 255, 0.5)',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          zIndex: 2
        }}
        onMouseEnter={(e) => e.target.style.color = '#FFD700'}
        onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.5)'}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

  const renderForm = () => {
    switch (mode) {
      case 'verify':
        return (
          <form onSubmit={handleVerification} className="space-y-4">
            <input
              type="text"
              name="code"
              placeholder="Enter verification code"
              value={formData.code}
              onChange={handleInputChange}
              style={commonInputStyle}
            />
            <button
              type="submit"
              disabled={loading}
              style={commonButtonStyle}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              style={{
                ...commonButtonStyle,
                backgroundColor: 'transparent',
                border: '2px solid rgba(255, 165, 0, 0.3)',
                marginTop: '1rem'
              }}
            >
              Resend verification code
            </button>
          </form>
        );

      case 'signup':
        return (
          <form onSubmit={handleSignUp} className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              style={commonInputStyle}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              style={commonInputStyle}
            />
            {renderPasswordInput()}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={commonButtonStyle}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        );

      case 'signin':
      default:
        return (
          <form onSubmit={handleSignIn} className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              style={commonInputStyle}
            />
            {renderPasswordInput()}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={commonButtonStyle}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        );
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1000,
      backdropFilter: 'blur(5px)',
      fontFamily: '"Cinzel", serif'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(20, 20, 20, 0.95))',
        padding: '3rem',
        borderRadius: '15px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 165, 0, 0.3)',
        border: '1px solid rgba(255, 165, 0, 0.3)',
        color: '#fff',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#FFD700',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          letterSpacing: '4px'
        }}>MONKE</h1>

        {error && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            backgroundColor: error.includes('verified') || error.includes('sent') ? 
              'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
            border: `1px solid ${error.includes('verified') || error.includes('sent') ? 
              '#00ff00' : '#ff0000'}`,
            color: error.includes('verified') || error.includes('sent') ? 
              '#00ff00' : '#ff0000',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {renderForm()}

        {mode !== 'verify' && (
          <>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFD700',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  textDecoration: 'underline',
                  opacity: 0.8,
                  transition: 'opacity 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.opacity = 1}
                onMouseLeave={(e) => e.target.style.opacity = 0.8}
              >
                {mode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
              </button>
            </div>

            <div style={{ textAlign: 'center', position: 'relative', margin: '2rem 0' }}>
              <div style={{ 
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'absolute',
                top: '50%',
                width: '100%',
                zIndex: 1
              }}></div>
              <span style={{
                background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(20, 20, 20, 0.95))',
                padding: '0 1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                position: 'relative',
                zIndex: 2
              }}>or</span>
            </div>

            <button 
              onClick={handleGuestLogin}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: 'transparent',
                color: '#fff',
                borderRadius: '8px',
                border: '2px solid rgba(255, 165, 0, 0.3)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#FFD700';
                e.target.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(255, 165, 0, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Play as Guest
            </button>
          </>
        )}
      </div>

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }

          input:focus {
            border-color: #FFD700;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
          }
        `}
      </style>
    </div>
  );
};

export default StartScreen;