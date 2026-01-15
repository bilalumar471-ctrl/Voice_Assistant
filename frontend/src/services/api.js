/**
 * API Service - Handles communication with the backend
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Send a message to the AI and get a response
 */
export const sendMessage = async (sessionId, message) => {
  try {
    const response = await api.post('/chat', {
      session_id: sessionId,
      message: message,
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get response from server');
  }
};

/**
 * Reset conversation history
 */
export const resetSession = async (sessionId) => {
  try {
    const response = await api.post('/reset-session', {
      session_id: sessionId,
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to reset session');
  }
};

export default api;