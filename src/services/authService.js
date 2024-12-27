


//authservice.js
import { signIn, signUp, signOut, getCurrentUser, fetchUserAttributes, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_AWS_REGION,
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID
    }
  }
});

export const authService = {
  async signUp(username, email, password) {
    try {
      const { userId, isSignUpComplete } = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });
      return { userId, isSignUpComplete };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  async confirmSignUp(username, code) {
    try {
      await confirmSignUp({
        username,
        confirmationCode: code
      });
      return true;
    } catch (error) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  },

  async resendCode(username) {
    try {
      await resendSignUpCode({ username });
      return true;
    } catch (error) {
      console.error('Error resending code:', error);
      throw error;
    }
  },

  async signIn(username, password) {
    try {
      const signInResult = await signIn({ username, password });
      if (signInResult.isSignedIn) {
        return {
          username,
          isGuest: false
        };
      }
      throw new Error('Sign in failed');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const user = await getCurrentUser();
      if (user) {
        return {
          username: user.username,
          isGuest: false
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
};



