import { describe, it, expect } from 'vitest';
import { VoiceRecognitionService } from './VoiceRecognitionService';

describe('VoiceRecognitionService', () => {
  it('detects voice speech recognition capability cleanly', () => {
    const isSupported = VoiceRecognitionService.isSupported();
    expect(typeof isSupported).toBe('boolean');
  });

  it('handles startListening error callback when API is unsupported in Node/JSDOM environment', () => {
    let errorMessage = '';
    const started = VoiceRecognitionService.startListening({
      onResult: () => {},
      onError: (err) => {
        errorMessage = err;
      },
    });

    expect(started).toBe(false);
    expect(errorMessage).toContain('Web Speech API');
  });
});
