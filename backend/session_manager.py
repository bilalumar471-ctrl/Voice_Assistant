"""
Session Manager - Stores conversation history in memory
Each session has a unique ID and maintains its own conversation context
"""

from typing import Dict, List
from datetime import datetime, timedelta

class SessionManager:
    def __init__(self):
        # Store conversations: {session_id: [messages]}
        self.sessions: Dict[str, List[Dict]] = {}
        # Track when sessions were last accessed
        self.last_accessed: Dict[str, datetime] = {}
        
    def get_conversation(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        if session_id not in self.sessions:
            # Initialize new session with system message
            self.sessions[session_id] = [
                {
                    "role": "system",
                    "content": "You are a helpful voice assistant. Keep responses concise and conversational since they will be spoken aloud. Avoid using formatting like bullet points or numbered lists."
                }
            ]
        
        # Update last accessed time
        self.last_accessed[session_id] = datetime.now()
        return self.sessions[session_id]
    
    def add_message(self, session_id: str, role: str, content: str):
        """Add a message to the conversation"""
        conversation = self.get_conversation(session_id)
        conversation.append({"role": role, "content": content})
        
        # Keep only last 20 messages to avoid token limits
        # System message (index 0) + last 19 messages
        if len(conversation) > 21:
            self.sessions[session_id] = [conversation[0]] + conversation[-19:]
    
    def reset_session(self, session_id: str):
        """Clear conversation history for a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
        if session_id in self.last_accessed:
            del self.last_accessed[session_id]
    
    def cleanup_old_sessions(self, max_age_hours: int = 24):
        """Remove sessions that haven't been accessed in X hours"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        expired_sessions = [
            sid for sid, last_time in self.last_accessed.items()
            if last_time < cutoff_time
        ]
        
        for session_id in expired_sessions:
            self.reset_session(session_id)
        
        return len(expired_sessions)

# Global instance
session_manager = SessionManager()