/**
 * Voice service for handling speech recognition and text-to-speech functionality
 */

import { toast } from '@/hooks/use-toast';

export interface VoiceCommandHandler {
  command: string | RegExp;
  handler: (transcript: string) => void;
  description: string;
}

export interface SpeechOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private commandHandlers: VoiceCommandHandler[] = [];
  private defaultSpeechOptions: SpeechOptions = {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  };

  /**
   * Initialize the voice service
   */
  initialize(): boolean {
    try {
      // Check if browser supports speech recognition
      if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        toast({
          title: 'Voice Commands Unavailable',
          description: 'Your browser does not support speech recognition.',
          variant: 'destructive'
        });
        return false;
      }

      // Initialize speech recognition
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      // Initialize speech synthesis
      this.synthesis = window.speechSynthesis;

      // Set up event handlers
      this.setupEventHandlers();

      return true;
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      return false;
    }
  }

  /**
   * Set up speech recognition event handlers
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      toast({
        title: 'Voice Commands Active',
        description: 'Listening for commands...',
        variant: 'default'
      });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Restart recognition if it was stopped unexpectedly
      if (this.isListening) {
        this.recognition?.start();
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: 'Voice Recognition Error',
        description: `Error: ${event.error}`,
        variant: 'destructive'
      });
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log('Voice command detected:', transcript);
      
      // Process the command
      this.processCommand(transcript);
    };
  }

  /**
   * Process a voice command
   * @param transcript The speech recognition transcript
   */
  private processCommand(transcript: string): void {
    // Check if the transcript matches any registered command
    for (const handler of this.commandHandlers) {
      if (
        (typeof handler.command === 'string' && transcript.includes(handler.command.toLowerCase())) ||
        (handler.command instanceof RegExp && handler.command.test(transcript))
      ) {
        // Execute the command handler
        handler.handler(transcript);
        // Provide feedback
        this.speak(`Executing command: ${handler.description}`);
        return;
      }
    }

    // No matching command found
    this.speak('Sorry, I did not understand that command.');
  }

  /**
   * Start listening for voice commands
   */
  startListening(): void {
    if (!this.recognition || this.isListening) return;

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast({
        title: 'Voice Recognition Error',
        description: 'Failed to start speech recognition.',
        variant: 'destructive'
      });
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
      this.isListening = false;
      toast({
        title: 'Voice Commands Disabled',
        description: 'No longer listening for commands.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }

  /**
   * Register a voice command handler
   * @param handler The command handler to register
   */
  registerCommand(handler: VoiceCommandHandler): void {
    this.commandHandlers.push(handler);
  }

  /**
   * Unregister a voice command handler
   * @param command The command to unregister
   */
  unregisterCommand(command: string | RegExp): void {
    this.commandHandlers = this.commandHandlers.filter(
      (handler) => handler.command !== command
    );
  }

  /**
   * Speak text using text-to-speech
   * @param text The text to speak
   * @param options Speech synthesis options
   */
  speak(text: string, options?: SpeechOptions): void {
    if (!this.synthesis) return;

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply options
    const mergedOptions = { ...this.defaultSpeechOptions, ...options };
    if (mergedOptions.voice) utterance.voice = mergedOptions.voice;
    if (mergedOptions.rate) utterance.rate = mergedOptions.rate;
    if (mergedOptions.pitch) utterance.pitch = mergedOptions.pitch;
    if (mergedOptions.volume) utterance.volume = mergedOptions.volume;

    // Speak the utterance
    this.synthesis.speak(utterance);
  }

  /**
   * Get available voices for speech synthesis
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }

  /**
   * Set default speech options
   * @param options Speech synthesis options
   */
  setDefaultSpeechOptions(options: SpeechOptions): void {
    this.defaultSpeechOptions = { ...this.defaultSpeechOptions, ...options };
  }

  /**
   * Check if voice service is currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Get all registered command handlers
   */
  getRegisteredCommands(): VoiceCommandHandler[] {
    return [...this.commandHandlers];
  }
}

// Add TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const voiceService = new VoiceService();