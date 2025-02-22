# from fastapi import FastAPI
# from pydantic import BaseModel
# from openai import AsyncOpenAI
# import os
# from dotenv import load_dotenv
# from fastapi.middleware.cors import CORSMiddleware

# load_dotenv()

# app = FastAPI()

# origins = [
#     "http://localhost:3000",  # Next.js dev frontend
#     "http://127.0.0.1:3000",  # Alternate localhost
#     # "https://your-production-frontend.com",  # Deployed frontend URL
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,  
#     allow_credentials=True,
#     allow_methods=["*"],  
#     allow_headers=["*"],  
# )

# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# if not OPENAI_API_KEY:
#     raise ValueError("Missing OpenAI API Key. Ensure it's set in the .env file.")

# client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# class Query(BaseModel):
#     message: str

# @app.post("/chatbot/")
# async def get_response(query: Query):
#     """Handles chatbot requests using OpenAI GPT API"""
#     response = await process_message(query.message)
#     return {"response": response}

# async def process_message(message: str) -> str:
#     """Sends message to OpenAI GPT API and returns the response"""
#     try:
#         completion = await client.chat.completions.create(
#             model="gpt-3.5-turbo",
#             messages=[{"role": "user", "content": message}]
#         )
#         return completion.choices[0].message.content
#     except Exception as e:
#         return f"Error: {str(e)}"

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import AsyncOpenAI
import os
import aiomysql
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import json
import re

load_dotenv()

app = FastAPI()

# Database configuration from environment variables
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "db": os.getenv("DB_NAME", "patient_db"),
    "charset": "utf8mb4",
    "cursorclass": aiomysql.DictCursor
}

# Connection pool management
pool = None

@app.on_event("startup")
async def startup():
    global pool
    pool = await aiomysql.create_pool(**DB_CONFIG)

@app.on_event("shutdown")
async def shutdown():
    if pool:
        pool.close()
        await pool.wait_closed()

# CORS configuration (keep original settings)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI client initialization
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY missing from environment variables")
client = AsyncOpenAI(api_key=OPENAI_API_KEY)

class ChatQuery(BaseModel):
    message: str

async def extract_feedback_data(user_input: str) -> dict:
    """
    Extract structured feedback data using AI parsing
    Returns dict with keys: patient_id, treatment, feedback
    """
    extraction_prompt = """Analyze the following patient message and extract:
    - patient_id (numeric identifier)
    - treatment_type (medical treatment received)
    - feedback_text (patient experience feedback)
    
    Return JSON format. Return null if information is incomplete.
    
    Patient message: {message}"""
    
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a medical data extraction assistant"},
                {"role": "user", "content": extraction_prompt.format(message=user_input)}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Validate extracted data
        if not all(key in result for key in ["patient_id", "treatment_type", "feedback_text"]):
            return None
            
        if not re.match(r'^\d+$', str(result["patient_id"])):
            return None
            
        return {
            "patient_id": str(result["patient_id"]),
            "treatment": result["treatment_type"],
            "feedback": result["feedback_text"]
        }
        
    except (json.JSONDecodeError, KeyError):
        return None
    except Exception as e:
        print(f"Extraction error: {str(e)}")
        return None

async def store_feedback_record(data: dict) -> bool:
    """Store validated feedback data in MySQL database"""
    try:
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    INSERT INTO patient_feedback 
                    (patient_id, treatment, feedback)
                    VALUES (%s, %s, %s)
                    """,
                    (data["patient_id"], data["treatment"], data["feedback"])
                )
                await conn.commit()
                return True
    except Exception as e:
        print(f"Database operation failed: {str(e)}")
        return False

async def generate_guidance_response(user_input: str) -> str:
    """Generate conversational response to collect missing information"""
    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": """You are a patient feedback assistant. 
            Collect following information:
            1. Numeric Patient ID
            2. Treatment received
            3. Feedback about experience
            Ask for missing items one at a time in a friendly manner"""},
            {"role": "user", "content": user_input}
        ]
    )
    return response.choices[0].message.content

@app.post("/chat/")
async def handle_chat_request(query: ChatQuery):
    """
    Endpoint handling chat interactions
    1. Attempt data extraction from message
    2. Store valid data
    3. Generate appropriate response
    """
    try:
        # Attempt feedback data extraction
        feedback_data = await extract_feedback_data(query.message)
        
        if feedback_data:
            # Store in database
            if await store_feedback_record(feedback_data):
                return {"response": "Thank you for your feedback! Your input has been recorded."}
            return {"response": "We encountered an issue saving your feedback. Please try again later."}
        
        # Generate conversational guidance
        ai_response = await generate_guidance_response(query.message)
        return {"response": ai_response}
        
    except Exception as e:
        return {"response": f"System error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
