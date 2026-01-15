/**
 * VoiceAssistant - Optimized for Siri/Google Assistant-like experience
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { sendMessage } from '../services/api';
import './VoiceAssistant.css';

const VoiceAssistant = () => {
  const [sessionId] = useState(() => uuidv4());
  const [status, setStatus] = useState('idle');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(true);
  
  const silenceTimerRef = useRef(null);
  const processingRef = useRef(false);
  const lastTranscriptRef = useRef('');

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
  } = useSpeechSynthesis();

  // Smart silence detection with adaptive timing
  useEffect(() => {
    if (interimTranscript && isListening && !processingRef.current) {
      setCurrentTranscript(interimTranscript);
      
      // Clear existing timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Adaptive silence detection based on transcript length
      const silenceDelay = interimTranscript.split(' ').length > 5 ? 1200 : 1500;

      silenceTimerRef.current = setTimeout(() => {
        if (isListening && interimTranscript && !processingRef.current) {
          console.log('⏱️ Natural pause detected');
          stopListening();
        }
      }, silenceDelay);
    }
  }, [interimTranscript]);

  // Handle final transcript
  useEffect(() => {
    if (transcript && !isListening && hasStarted && !processingRef.current) {
      // Avoid duplicate processing
      if (transcript !== lastTranscriptRef.current && transcript.trim().length > 0) {
        console.log('📝 Final transcript:', transcript);
        lastTranscriptRef.current = transcript;
        handleUserMessage(transcript);
        resetTranscript();
      }
    }
  }, [transcript, isListening, hasStarted]);

  // Status updates
  useEffect(() => {
    if (processingRef.current) return;
    
    if (isSpeaking) {
      setStatus('speaking');
      // Ensure listening is stopped while speaking
      if (isListening) {
        stopListening();
      }
    } else if (isListening) {
      setStatus('listening');
    }
  }, [isListening, isSpeaking]);

  const handleUserMessage = async (message) => {
    if (!message.trim() || processingRef.current) return;

    processingRef.current = true;
    console.log('🗣️ Processing:', message);
    
    stopListening();
    setStatus('processing');
    setCurrentTranscript(message);

    try {
      const response = await sendMessage(sessionId, message);
      console.log('🤖 Response:', response.response);
      setLastResponse(response.response);
      
      // Small delay before speaking
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setStatus('speaking');
      
      speak(response.response, () => {
        console.log('✅ Speech complete');
        processingRef.current = false;
        setStatus('idle');
        setCurrentTranscript('');
        setLastResponse('');
        
        // Auto-restart listening with delay
        setTimeout(() => {
          if (!isSpeaking) {
            setStatus('listening');
            startListening();
          }
        }, 800);
      });

    } catch (err) {
      console.error('❌ Error:', err);
      processingRef.current = false;
      setStatus('error');
      setCurrentTranscript('Sorry, something went wrong');
      
      setTimeout(() => {
        setStatus('listening');
        setCurrentTranscript('');
        startListening();
      }, 2000);
    }
  };

  // Interruption: tap to interrupt bot while speaking
  const handleInterrupt = useCallback(() => {
    if (isSpeaking) {
      console.log('⚡ Interrupted');
      stopSpeaking();
      processingRef.current = false;
      setStatus('listening');
      setCurrentTranscript('');
      setLastResponse('');
      setTimeout(() => startListening(), 300);
    }
  }, [isSpeaking, stopSpeaking, startListening]);

  // Cancel current speech input
  const handleCancel = useCallback(() => {
    console.log('❌ Cancelled');
    stopListening();
    stopSpeaking();
    processingRef.current = false;
    setStatus('idle');
    setCurrentTranscript('');
    setLastResponse('');
    
    // Restart listening after brief pause
    setTimeout(() => {
      setStatus('listening');
      startListening();
    }, 500);
  }, [stopListening, stopSpeaking, startListening]);

  const handleStart = () => {
    console.log('🚀 Starting assistant');
    setNeedsPermission(false);
    setStatus('listening');
    setHasStarted(true);
    
    speak('Hello! How can I help you?', () => {
      console.log('✅ Ready');
      startListening();
    });
  };

  // Circular Waveform with improved animation
  const CircularWaveform = () => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 120;
      
      const particleCount = 60;
      const particles = Array(particleCount).fill(0).map((_, i) => ({
        angle: (Math.PI * 2 * i) / particleCount,
        distance: Math.random() * 30 + 10,
        speed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
      }));

      const animate = () => {
        ctx.clearRect(0, 0, width, height);

        // Glow effect
        const glowIntensity = status === 'speaking' ? 0.5 : status === 'listening' ? 0.4 : 0.2;
        const gradient = ctx.createRadialGradient(
          centerX, centerY, baseRadius - 20, 
          centerX, centerY, baseRadius + 60
        );
        
        const color = status === 'listening' ? '59, 130, 246' : 
                     status === 'processing' ? '139, 92, 246' :
                     status === 'speaking' ? '16, 185, 129' : 
                     status === 'error' ? '239, 68, 68' : '107, 114, 128';
        
        gradient.addColorStop(0, `rgba(${color}, ${glowIntensity})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + 60, 0, Math.PI * 2);
        ctx.fill();

        // Main circle with pulse
        const pulseScale = status === 'speaking' ? Math.sin(Date.now() * 0.005) * 5 : 0;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${color})`;
        ctx.fill();

        // Animated particles
        if (status === 'speaking' || status === 'listening') {
          particles.forEach((particle) => {
            particle.phase += particle.speed;
            const intensity = status === 'speaking' ? 1.2 : 0.8;
            const wave = Math.sin(particle.phase) * particle.distance * intensity;
            const radius = baseRadius + wave + 20;
            
            const x = centerX + Math.cos(particle.angle) * radius;
            const y = centerY + Math.sin(particle.angle) * radius;

            const size = status === 'speaking' ? 4 : 3;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, 0.9)`;
            ctx.fill();
          });
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [status]);

    return <canvas ref={canvasRef} width={500} height={500} className="waveform-canvas" />;
  };

  const getStatusText = () => {
    if (needsPermission) return 'Ready to start';
    if (status === 'error') return 'Oops! Something went wrong';
    if (status === 'listening') return currentTranscript || 'I\'m listening...';
    if (status === 'processing') return 'Thinking...';
    if (status === 'speaking') return lastResponse;
    return 'Say something...';
  };

  const getHintText = () => {
    if (needsPermission) return 'Click below to begin';
    if (isSpeaking) return 'Tap anywhere to interrupt';
    if (isListening && currentTranscript) return 'Keep talking or pause...';
    return 'Speak naturally';
  };

  return (
    <div 
      className="voice-container" 
      onClick={handleInterrupt}
      style={{ cursor: isSpeaking ? 'pointer' : 'default' }}
    >
      <div className="voice-interface">
        <CircularWaveform />
        
        <div className="status-display">
          <p className="status-text">{getStatusText()}</p>
          <p className="hint-text">{getHintText()}</p>
        </div>

        {needsPermission ? (
          <button className="start-button" onClick={(e) => { e.stopPropagation(); handleStart(); }}>
            <span className="button-icon">🎤</span>
            <span>Start Voice Assistant</span>
          </button>
        ) : (
          <div className="control-buttons">
            {/* Show cancel button when listening, processing, or idle (but not speaking) */}
            {!isSpeaking && (
              <button 
                className="cancel-button" 
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                title="Cancel and restart"
              >
                <span className="button-icon">✖️</span>
                <span>Cancel</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;