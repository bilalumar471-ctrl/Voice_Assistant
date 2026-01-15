/**
 * Custom Hook for Speech Synthesis (Text-to-Speech)
 * Uses browser's Web Speech Synthesis API
 */

import { useState, useCallback, useEffect } from 'react';

const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if browser supports Speech Synthesis
    if (!window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Select a default English voice
      const englishVoice = availableVoices.find(
        voice => voice.lang.startsWith('en-')
      );
      setSelectedVoice(englishVoice || availableVoices[0]);
    };

    loadVoices();
    
    // Voices may load asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Speak text
  const speak = useCallback((text, onEnd) => {
    if (!isSupported) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Set properties
    utterance.rate = 1.0; // Speed (0.1 to 10)
    utterance.pitch = 1.0; // Pitch (0 to 2)
    utterance.volume = 1.0; // Volume (0 to 1)

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    // Speak!
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, isSupported]);

  // Stop speaking
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Pause speaking
  const pause = useCallback(() => {
    window.speechSynthesis.pause();
  }, []);

  // Resume speaking
  const resume = useCallback(() => {
    window.speechSynthesis.resume();
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    isSupported,
  };
};

export default useSpeechSynthesis;