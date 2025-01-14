// src/config/aws-config.js
const awsConfig = {
    region: import.meta.env.VITE_AWS_REGION,
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    apiUrl: import.meta.env.VITE_API_URL,
    cookieStorage: {
      domain: window.location.hostname,
      secure: true,
      path: '/',
      expires: 365
    }
  };
  
  export default awsConfig;