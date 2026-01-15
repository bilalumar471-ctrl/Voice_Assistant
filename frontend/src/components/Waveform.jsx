/**
 * Waveform - Animated waveform visualization while bot is speaking
 */

import React, { useEffect, useRef } from 'react';
import './Waveform.css';

const Waveform = ({ isActive }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const barCount = 50;
    const barWidth = width / barCount;
    const bars = Array(barCount).fill(0).map(() => ({
      height: Math.random() * 0.5 + 0.2,
      speed: Math.random() * 0.05 + 0.02,
      direction: Math.random() > 0.5 ? 1 : -1,
    }));

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (isActive) {
        // Update and draw bars
        bars.forEach((bar, i) => {
          // Update height
          bar.height += bar.speed * bar.direction;
          
          // Bounce at limits
          if (bar.height > 0.9) {
            bar.direction = -1;
          } else if (bar.height < 0.2) {
            bar.direction = 1;
          }

          // Draw bar
          const x = i * barWidth;
          const barHeight = bar.height * height;
          const y = (height - barHeight) / 2;

          // Gradient
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(1, '#8b5cf6');

          ctx.fillStyle = gradient;
          ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        });
      } else {
        // Draw flat line when inactive
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  return (
    <div className="waveform-container">
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        className="waveform-canvas"
      />
    </div>
  );
};

export default Waveform;