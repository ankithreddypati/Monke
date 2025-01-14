// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    assetsInclude: ['**/*.mp3'],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'three': ['three'],
            'physics': ['@react-three/rapier'],
            'fiber': ['@react-three/fiber', '@react-three/drei'],
            'vendor': ['@aws-amplify/core', '@aws-sdk/client-lex-runtime-v2']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
    define: {
      'process.env': {
        VITE_AWS_REGION: JSON.stringify(env.VITE_AWS_REGION),
        VITE_COGNITO_USER_POOL_ID: JSON.stringify(env.VITE_COGNITO_USER_POOL_ID),
        VITE_COGNITO_CLIENT_ID: JSON.stringify(env.VITE_COGNITO_CLIENT_ID),
        VITE_API_URL: JSON.stringify(env.VITE_API_URL),
        VITE_LEX_BOT_LEVEL1_ID: JSON.stringify(env.VITE_LEX_BOT_LEVEL1_ID),
        VITE_LEX_BOT_ALIAS_LEVEL1_ID: JSON.stringify(env.VITE_LEX_BOT_ALIAS_LEVEL1_ID),
        VITE_LEX_BOT_LEVEL2_ID: JSON.stringify(env.VITE_LEX_BOT_LEVEL2_ID),
        VITE_LEX_BOT_ALIAS_LEVEL2_ID: JSON.stringify(env.VITE_LEX_BOT_ALIAS_LEVEL2_ID)
      }
    }
  }
})