// services/AudioManager.js
import footstepSound from '../assets/sounds/footstep.mp3';
import runningSound from '../assets/sounds/running.mp3';
import jumpSound from '../assets/sounds/jump.mp3';
import cutscenePart1Sound from "../assets/sounds/jo1.mp3";
import cutscenePart2Sound from "../assets/sounds/jo2.mp3";

class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.currentlyPlaying = new Set();
        this.currentDynamicAudio = null;
    }

    loadSound(id, url) {
        const audio = new Audio(url);
        audio.onerror = (e) => {
            console.error(`Failed to load sound '${id}' from URL: ${url}`, e);
        };
        this.sounds.set(id, audio);
        return audio;
    }

    playSound(id, options = {}) {
        const { loop = false, volume = 1, onEnd } = options;
        const sound = this.sounds.get(id);

        if (!sound) {
            console.warn(`Sound ${id} not found`);
            return;
        }

        sound.loop = loop;
        sound.volume = volume;

        if (onEnd) {
            sound.addEventListener('ended', onEnd, { once: true });
        }

        if (loop) {
            this.currentlyPlaying.add(id);
        }

        sound.currentTime = 0;

        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`Error playing sound ${id}:`, error);
            });
        }
    }

    async playDynamicAudio(audioStream, options = {}) {
      try {
          this.cleanupDynamicAudio();
  
          let audioData;
          if (audioStream instanceof Uint8Array) {
              audioData = audioStream;
          } else {
              // Browser-compatible way to handle streams
              const chunks = [];
              let totalLength = 0;
              
              if (audioStream.getReader) {
                  const reader = audioStream.getReader();
                  while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      chunks.push(value);
                      totalLength += value.length;
                  }
                  
                  // Combine chunks into single Uint8Array
                  audioData = new Uint8Array(totalLength);
                  let offset = 0;
                  for (const chunk of chunks) {
                      audioData.set(chunk, offset);
                      offset += chunk.length;
                  }
              } else {
                  audioData = audioStream;
              }
          }
  
          const audioBlob = new Blob([audioData], { 
              type: 'audio/mpeg'
          });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
  
          this.currentDynamicAudio = {
              audio,
              url: audioUrl
          };
  
          if (options.volume) {
              audio.volume = Math.max(0, Math.min(1, options.volume));
          }
  
          return new Promise((resolve, reject) => {
              audio.onended = () => {
                  this.cleanupDynamicAudio();
                  if (options.onEnd) options.onEnd();
                  resolve(true);
              };
  
              audio.onerror = (error) => {
                  console.error('Audio playback error:', error);
                  this.cleanupDynamicAudio();
                  reject(error);
              };
  
              audio.oncanplaythrough = () => {
                  audio.play().catch(error => {
                      console.error('Play error:', error);
                      reject(error);
                  });
              };
          });
  
      } catch (error) {
          console.error('Error playing dynamic audio:', error);
          this.cleanupDynamicAudio();
          throw error;
      }
  }

    cleanupDynamicAudio() {
        if (this.currentDynamicAudio) {
            if (this.currentDynamicAudio.audio) {
                this.currentDynamicAudio.audio.pause();
                this.currentDynamicAudio.audio = null;
            }
            URL.revokeObjectURL(this.currentDynamicAudio.url);
            this.currentDynamicAudio = null;
        }
    }

    stopSound(id) {
        const sound = this.sounds.get(id);
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
            this.currentlyPlaying.delete(id);
        }
    }

    stopAllSounds() {
        this.sounds.forEach((sound, id) => {
            this.stopSound(id);
        });
        this.currentlyPlaying.clear();
        this.cleanupDynamicAudio();
    }

    setVolume(idasync, volume) {
        const sound = this.sounds.get(id);
        if (sound) {
            sound.volume = Math.max(0, Math.min(1, volume));
        }
    }

    isPlaying(id) {
        return this.currentlyPlaying.has(id);
    }

    cleanup() {
        this.stopAllSounds();
        this.cleanupDynamicAudio();
    }
}

// Create and export a singleton instance
export const audioManager = new AudioManager();

// Function to initialize all game sounds
export const initializeGameSounds = async () => {
    const soundFiles = {
        footstep: footstepSound,
        running: runningSound,
        jump: jumpSound,
        cutscene_part1: cutscenePart1Sound,
        cutscene_part2: cutscenePart2Sound
    };

    const loadPromises = Object.entries(soundFiles).map(([id, url]) => {
        return new Promise((resolve, reject) => {
            const audio = audioManager.loadSound(id, url);
            
            audio.addEventListener('canplaythrough', () => {
                resolve();
            });
            
            audio.addEventListener('error', (e) => {
                reject(new Error(`Failed to load sound ${id}: ${e.message}`));
            });
        });
    });

    try {
        await Promise.all(loadPromises);
    } catch (error) {
        console.error('Error loading sounds:', error);
    }
};