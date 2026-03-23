import { useCallback } from 'react';

export function useTextToSpeech() {
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
       console.warn('SpeechSynthesis API not supported in this browser.');
       return;
    }
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a good natural English or default voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.lang === 'en-US');
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak };
}
