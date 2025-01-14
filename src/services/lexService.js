// src/services/lexService.js
import { LexRuntimeV2Client, RecognizeUtteranceCommand } from "@aws-sdk/client-lex-runtime-v2";

class LexService {
  constructor() {
    this.client = new LexRuntimeV2Client({
      region: import.meta.env.VITE_AWS_REGION,
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,        // Direct access key
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY // Direct secret key
      }
    });

    this.BOT_ID = import.meta.env.VITE_LEX_BOT_ID;
    this.BOT_ALIAS_ID = import.meta.env.VITE_LEX_BOT_ALIAS_ID;
  }

  async sendAudio(audioData, sessionId) {
    try {
      const input = {
        botId: this.BOT_ID,
        botAliasId: this.BOT_ALIAS_ID,
        localeId: "en_US",
        sessionId: sessionId,
        requestContentType: "audio/x-l16; sample-rate=16000; channel-count=1",
        inputStream: audioData
      };

      const command = new RecognizeUtteranceCommand(input);
      return await this.client.send(command);
    } catch (error) {
      console.error('Error sending audio to Lex:', error);
      throw error;
    }
  }
}

export const lexService = new LexService();