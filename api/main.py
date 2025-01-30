from fastapi import FastAPI
from pydantic import BaseModel
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:3000",  # Next.js dev frontend
    "http://127.0.0.1:3000",  # Alternate localhost
    # "https://your-production-frontend.com",  # Deployed frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("Missing OpenAI API Key. Ensure it's set in the .env file.")

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

class Query(BaseModel):
    message: str

@app.post("/chatbot/")
async def get_response(query: Query):
    """Handles chatbot requests using OpenAI GPT API"""
    response = await process_message(query.message)
    return {"response": response}

async def process_message(message: str) -> str:
    """Sends message to OpenAI GPT API and returns the response"""
    try:
        completion = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": message}]
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
