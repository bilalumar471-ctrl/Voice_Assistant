import os
import random
import time
from typing import List, Dict
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "sk-mock-key"))

# Mock responses for testing without API
MOCK_RESPONSES = [
    "That's an interesting question! I'm currently running in mock mode, but I'm here to help test the voice interface.",
    "I hear you loud and clear! Once connected to OpenAI, I'll be able to provide more helpful responses.",
    "Great to talk with you! Right now I'm using pre-programmed responses, but the voice features are working perfectly.",
    "I'm listening! This is a mock response to test the voice assistant functionality.",
    "Thanks for testing the voice interface with me! Everything seems to be working smoothly.",
]

GREETING_RESPONSES = [
    "Hello! Nice to meet you. I'm your voice assistant in mock mode.",
    "Hi there! Great to hear your voice. How can I help you today?",
    "Hey! I'm ready to chat. What's on your mind?",
]

FAREWELL_RESPONSES = [
    "Goodbye! It was nice talking with you.",
    "See you later! Have a great day.",
    "Take care! Feel free to come back anytime.",
]


def get_mock_response(messages: List[Dict]) -> str:

    # Simulate API delay
    time.sleep(random.uniform(0.5, 1.5))
    
    # Get the last user message
    last_message = ""
    for msg in reversed(messages):
        if msg["role"] == "user":
            last_message = msg["content"].lower()
            break
    
    # Pattern-based responses
    if any(word in last_message for word in ["hello", "hi", "hey", "greetings"]):
        return random.choice(GREETING_RESPONSES)
    
    if any(word in last_message for word in ["bye", "goodbye", "see you", "later"]):
        return random.choice(FAREWELL_RESPONSES)
    
    if any(word in last_message for word in ["how are you", "how's it going", "what's up"]):
        return "I'm doing great, thanks for asking! I'm currently in mock mode but all the voice features are working well."
    
    if "name" in last_message and ("your" in last_message or "what" in last_message):
        return "I'm your voice assistant! Right now I'm running in test mode with mock responses."
    
    if "joke" in last_message:
        jokes = [
            "Why do programmers prefer dark mode? Because light attracts bugs!",
            "Why did the developer go broke? Because they used up all their cache!",
            "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
        ]
        return random.choice(jokes)
    
    if len(messages) > 5:  # Show context awareness
        return f"We've been chatting for a bit now! I'm keeping track of our {len(messages) - 1} message conversation in this session."
    
    # Default random response
    return random.choice(MOCK_RESPONSES)


def get_openai_response(messages: List[Dict]) -> str:

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # or "gpt-4" if you have access
            messages=messages,
            temperature=0.7,
            max_tokens=150,  # Keep responses concise for voice
        )
        return response.choices[0].message.content
    
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        return "I'm having trouble connecting to my AI brain right now. Please try again in a moment."


def get_ai_response(messages: List[Dict], use_mock: bool = None) -> str:
    """
    Main function to get AI response
    Switches between mock and real based on environment variable
    """
    # FORCE OpenAI for testing
    use_mock = False  # <-- FORCING to False
    
    if use_mock:
        print("🤖 Using MOCK response")
        return get_mock_response(messages)
    else:
        print("🤖 Using OPENAI API")
        return get_openai_response(messages)