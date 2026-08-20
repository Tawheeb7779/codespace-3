/**
 * Browser Web Speech API Recognition Wrapper Service
 * Provides speech-to-text dictation across editor, terminal, AI drawer, and search panels.
 */

export interface VoiceRecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class VoiceRecognitionService {
  private static recognition: any = null;

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && Boolean('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  public static startListening(options: VoiceRecognitionOptions): boolean {
    if (!this.isSupported()) {
      options.onError?.('Web Speech API is not supported in this browser.');
      return false;
    }

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        options.onResult(transcript);
      };

      this.recognition.onerror = (event: any) => {
        options.onError?.(event.error || 'Speech recognition error occurred.');
      };

      this.recognition.onend = () => {
        options.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      options.onError?.(msg);
      return false;
    }
  }

  public static stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop errors
      }
      this.recognition = null;
    }
  }
}
