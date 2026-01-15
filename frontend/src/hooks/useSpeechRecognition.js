/**
 * Custom Hook for Speech Recognition (Speech-to-Text)
 * Uses browser's Web Speech API
 */

import { useState, useEffect, useRef } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Get partial results
    recognition.lang = 'en-US';

    // Handle results
    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        } else {
          interimText += transcript;
        }
      }

      setInterimTranscript(interimText);
      
      if (finalText) {
        setTranscript(finalText.trim());
        setInterimTranscript('');
      }
    };

    // Handle errors
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors, they're common
        return;
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    // Handle end (auto-restart if still listening)
    recognition.onend = () => {
      if (isListening) {
        // Restart recognition if we're still supposed to be listening
        try {
          recognition.start();
        } catch (err) {
          console.error('Error restarting recognition:', err);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Start listening
  const startListening = () => {
    if (!isSupported) return;
    
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setIsListening(true);
    
    try {
      recognitionRef.current?.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
    }
  };

  // Stop listening
  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  // Reset transcript
  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeechRecognition;