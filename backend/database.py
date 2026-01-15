import os
from datetime import datetime
from typing import List, Dict, Optional
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = "voice_assistant"

# Initialize MongoDB client
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]

# Collections
conversations_collection = db["conversations"]
sessions_collection = db["sessions"]


def save_message(session_id: str, role: str, content: str) -> bool:
    """
    Save a message to the database
    
    Args:
        session_id: Unique session identifier
        role: 'user' or 'assistant'
        content: Message content
    
    Returns:
        bool: True if successful
    """
    try:
        message = {
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow()
        }
        
        conversations_collection.insert_one(message)
        
        # Update session last activity
        sessions_collection.update_one(
            {"session_id": session_id},
            {
                "$set": {"last_activity": datetime.utcnow()},
                "$setOnInsert": {"created_at": datetime.utcnow()}
            },
            upsert=True
        )
        
        return True
    
    except Exception as e:
        print(f"Error saving message: {e}")
        return False


def get_conversation_history(session_id: str, limit: int = 50) -> List[Dict]:
    """
    Get conversation history for a session
    
    Args:
        session_id: Unique session identifier
        limit: Maximum number of messages to retrieve
    
    Returns:
        List of messages
    """
    try:
        messages = conversations_collection.find(
            {"session_id": session_id}
        ).sort("timestamp", 1).limit(limit)
        
        return [{
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["timestamp"].isoformat()
        } for msg in messages]
    
    except Exception as e:
        print(f"Error retrieving conversation: {e}")
        return []


def get_all_sessions(limit: int = 100) -> List[Dict]:
    """
    Get all sessions with their last activity
    
    Args:
        limit: Maximum number of sessions to retrieve
    
    Returns:
        List of sessions
    """
    try:
        sessions = sessions_collection.find().sort("last_activity", -1).limit(limit)
        
        return [{
            "session_id": session["session_id"],
            "created_at": session["created_at"].isoformat(),
            "last_activity": session["last_activity"].isoformat()
        } for session in sessions]
    
    except Exception as e:
        print(f"Error retrieving sessions: {e}")
        return []


def delete_session(session_id: str) -> bool:
    """
    Delete a session and all its messages
    
    Args:
        session_id: Unique session identifier
    
    Returns:
        bool: True if successful
    """
    try:
        conversations_collection.delete_many({"session_id": session_id})
        sessions_collection.delete_one({"session_id": session_id})
        return True
    
    except Exception as e:
        print(f"Error deleting session: {e}")
        return False


def get_session_stats(session_id: str) -> Dict:
    """
    Get statistics for a session
    
    Args:
        session_id: Unique session identifier
    
    Returns:
        Dictionary with stats
    """
    try:
        total_messages = conversations_collection.count_documents({"session_id": session_id})
        user_messages = conversations_collection.count_documents({"session_id": session_id, "role": "user"})
        assistant_messages = conversations_collection.count_documents({"session_id": session_id, "role": "assistant"})
        
        return {
            "total_messages": total_messages,
            "user_messages": user_messages,
            "assistant_messages": assistant_messages
        }
    
    except Exception as e:
        print(f"Error getting stats: {e}")
        return {}


# Create indexes for better performance
conversations_collection.create_index([("session_id", 1), ("timestamp", 1)])
sessions_collection.create_index("session_id", unique=True)

print("✅ Database connected successfully")