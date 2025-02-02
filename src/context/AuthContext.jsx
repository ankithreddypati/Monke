
// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const clearExistingSession = async () => {
      try {
        await amplifySignOut();
      } catch (error) {
        console.log('No existing session');
      } finally {
        setIsLoading(false);
      }
    };

    clearExistingSession();
  }, []);

  const updateUserState = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const signOut = async () => {
    try {
      await amplifySignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <div className="w-full h-full flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{
      user,
      setUser: updateUserState,
      isAuthenticated,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};