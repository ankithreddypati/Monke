// // AuthContext.jsx
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { getCurrentUser } from 'aws-amplify/auth';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     checkAuthState();
//   }, []);

//   const checkAuthState = async () => {
//     try {
//       const currentUser = await getCurrentUser();
//       if (currentUser) {
//         const userData = {
//           username: currentUser.username,
//           isGuest: false,
//           isSignedIn: true
//         };
//         setUser(userData);
//         setIsAuthenticated(true);
//       }
//     } catch (error) {
//       // If no authenticated user is found, check for guest session in localStorage
//       const guestSession = localStorage.getItem('guestUser');
//       if (guestSession) {
//         const guestUser = JSON.parse(guestSession);
//         setUser(guestUser);
//         setIsAuthenticated(true);
//       } else {
//         setUser(null);
//         setIsAuthenticated(false);
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const updateUserState = (userData) => {
//     // Store guest user data in localStorage if it's a guest
//     if (userData.isGuest) {
//       localStorage.setItem('guestUser', JSON.stringify(userData));
//     }
//     setUser(userData);
//     setIsAuthenticated(true);
//   };

//   const signOut = async () => {
//     try {
//       // Clear guest session if exists
//       localStorage.removeItem('guestUser');
//       setUser(null);
//       setIsAuthenticated(false);
//     } catch (error) {
//       console.error('Sign out failed:', error);
//     }
//   };

//   const value = {
//     user,
//     setUser: updateUserState,
//     isAuthenticated,
//     setIsAuthenticated,
//     isLoading,
//     checkAuthState,
//     signOut
//   };

//   if (isLoading) {
//     return <div className="w-full h-full flex items-center justify-center">
//       <div className="text-xl">Loading...</div>
//     </div>;
//   }

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };


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