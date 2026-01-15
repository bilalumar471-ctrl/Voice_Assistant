/**
 * StatusIndicator - Shows the current state of the voice assistant
 */

import React from 'react';
import './StatusIndicator.css';

const StatusIndicator = ({ status, interimTranscript }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'idle':
        return {
          text: 'Ready to listen',
          color: '#6b7280',
          icon: '🎤',
        };
      case 'listening':
        return {
          text: 'Listening...',
          color: '#3b82f6',
          icon: '👂',
        };
      case 'processing':
        return {
          text: 'Thinking...',
          color: '#8b5cf6',
          icon: '🤔',
        };
      case 'speaking':
        return {
          text: 'Speaking...',
          color: '#10b981',
          icon: '🔊',
        };
      case 'error':
        return {
          text: 'Error occurred',
          color: '#ef4444',
          icon: '⚠️',
        };
      default:
        return {
          text: 'Ready',
          color: '#6b7280',
          icon: '🎤',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="status-indicator">
      <div 
        className={`status-dot ${status}`}
        style={{ backgroundColor: statusInfo.color }}
      />
      <div className="status-content">
        <span className="status-icon">{statusInfo.icon}</span>
        <span className="status-text" style={{ color: statusInfo.color }}>
          {statusInfo.text}
        </span>
      </div>
      {interimTranscript && (
        <div className="interim-transcript">
          <em>"{interimTranscript}"</em>
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;