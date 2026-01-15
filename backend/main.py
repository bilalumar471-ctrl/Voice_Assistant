from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn

from session_manager import session_manager
from openai_service import get_ai_response
from database import (
    save_message, 
    get_conversation_history, 
    get_all_sessions, 
    delete_session,
    get_session_stats
)

# Initialize FastAPI app
app = FastAPI(title="Voice Assistant API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    response: str
    session_id: str


class ResetRequest(BaseModel):
    session_id: str


# Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Voice Assistant API",
        "version": "1.0.0"
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint
    Receives user message, maintains context, returns AI response
    """
    try:
        # Get conversation history
        conversation = session_manager.get_conversation(request.session_id)
        
        # Add user message
        session_manager.add_message(
            request.session_id,
            "user",
            request.message
        )
        
        # Save user message to database
        save_message(request.session_id, "user", request.message)
        
        # Get updated conversation
        conversation = session_manager.get_conversation(request.session_id)
        
        # Get AI response (mock or real based on .env)
        ai_response = get_ai_response(conversation)
        
        # Add assistant response to history
        session_manager.add_message(
            request.session_id,
            "assistant",
            ai_response
        )
        
        # Save assistant response to database
        save_message(request.session_id, "assistant", ai_response)
        
        return ChatResponse(
            response=ai_response,
            session_id=request.session_id
        )
    
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reset-session")
async def reset_session(request: ResetRequest):
    """Reset conversation history for a session"""
    try:
        session_manager.reset_session(request.session_id)
        return {"status": "success", "message": "Session reset successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cleanup")
async def cleanup_sessions():
    """Cleanup old sessions (can be called periodically)"""
    try:
        removed = session_manager.cleanup_old_sessions(max_age_hours=24)
        return {
            "status": "success",
            "sessions_removed": removed
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history/{session_id}")
async def get_history(session_id: str, limit: int = 50):
    """Get conversation history from database"""
    try:
        history = get_conversation_history(session_id, limit)
        return {
            "session_id": session_id,
            "messages": history,
            "count": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions")
async def get_sessions(limit: int = 100):
    """Get all sessions"""
    try:
        sessions = get_all_sessions(limit)
        return {
            "sessions": sessions,
            "count": len(sessions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/session/{session_id}")
async def delete_session_endpoint(session_id: str):
    """Delete a session and its messages"""
    try:
        success = delete_session(session_id)
        if success:
            return {"status": "success", "message": "Session deleted"}
        else:
            raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/{session_id}")
async def get_stats(session_id: str):
    """Get session statistics"""
    try:
        stats = get_session_stats(session_id)
        return {
            "session_id": session_id,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Run the server
if __name__ == "__main__":
    print("🚀 Starting Voice Assistant Backend...")
    print("📍 API will be available at: http://localhost:8000")
    print("📖 API docs available at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)