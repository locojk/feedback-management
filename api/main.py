from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import AsyncOpenAI
import os
import time
import aiomysql
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import json
import re
from datetime import datetime
from typing import Optional
import logging
import random
import async_timeout
from logging.handlers import RotatingFileHandler
import requests
import threading


MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
# API endpoint
writing_url = "https://e-react-node-backend-22ed6864d5f3.herokuapp.com/table/doctor_message_hub"

# Configure logging with file rotation
log_formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s")
logging.basicConfig(level=logging.INFO)

# File handler (100MB per file, max 5 files)
file_handler = RotatingFileHandler(
    'patient_feedback.log',
    maxBytes=100*1024*1024,
    backupCount=5,
    encoding='utf-8'
)
file_handler.setFormatter(log_formatter)


# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)

# Get logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(console_handler)
logger.info("Log file start")
logger.propagate = False


load_dotenv()

app = FastAPI()

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "db": os.getenv("DB_NAME", "patient_db"),
    "charset": "utf8mb4",
    "cursorclass": aiomysql.DictCursor
}

pool = None

@app.on_event("startup")
async def startup():
    global pool
    try:
        pool = await aiomysql.create_pool(**DB_CONFIG)
        logger.info("Database pool created successfully")
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown():
    if pool:
        pool.close()
        await pool.wait_closed()
        logger.info("Database pool closed")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatQuery(BaseModel):
    message: str

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def log_ai_operation(operation: str, result: any):
    """Log AI operations with sanitized data"""
    logger.info(f"AI {operation} result: {str(result)}")

async def safe_ai_call(func, *args, **kwargs):
    """AI operation wrapper with enhanced logging"""
    try:
        async with async_timeout.timeout(15):  # Use async with for async context manager
            result = await func(*args, **kwargs)
            await log_ai_operation(func.__name__, result)
            return result
    except TimeoutError:
        logger.error("AI operation timed out")
        return None
    except Exception as e:
        logger.error(f"AI operation failed: {str(e)}")
        return None


async def extract_feedback_data(user_input: str) -> Optional[dict]:
    """Data extraction with validation and logging"""
    logger.info(f"Extracting data from: {user_input[:100]}...")
    try:
        result = await safe_ai_call(
            client.chat.completions.create,
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract the following information from the given text and output it in JSON format:\n\n"
                        "- patient_id: The numeric ID of the patient.\n"
                        "- treatment_type: The type of treatment mentioned.\n"
                        "- feedback_text: The feedback provided by the patient.\n\n"
                        "Example input:\n"
                        '"1006. Treatment: Physical Therapy. Feedback: Excellent sessions but waiting times were too long."\n\n'
                        "Example output:\n"
                        '{\n'
                        '  "patient_id": 1006,\n'
                        '  "treatment_type": "Physical Therapy",\n'
                        '  "feedback_text": "Excellent sessions but waiting times were too long."\n'
                        '}'
                    )
                },
                {"role": "user", "content": user_input}
            ],
            response_format={"type": "json_object"}
        )
        logger.info(f"Extraction result: {result}")

        if not result:
            logger.warning("No result from AI extraction")
            return None
            
        data = json.loads(result.choices[0].message.content)
        logger.debug(f"Raw extraction: {data}")
        
        # Validate required fields
        if not all(k in data for k in ("patient_id", "treatment_type", "feedback_text")):
            logger.error("Missing required fields in extraction")
            return None
            
        # Validate patient ID format
        if not re.fullmatch(r'^\d+$', str(data["patient_id"])):
            logger.error(f"Invalid patient ID format: {data['patient_id']}")
            return None
            
        return {
            "patient_id": str(data["patient_id"]),
            "treatment": data["treatment_type"].strip()[:999],
            "feedback": data["feedback_text"].strip()[:4999]
        }
        
    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}")
        return None

async def analyze_severity(patient_id: str, treatment: str, feedback: str) -> str:
    """Severity analysis with schema-compatible output and retry logic for DB connection"""
    logger.info(f"Analyzing severity for {patient_id}/{treatment}")
    
    # Retry loop for database connection
    retries = 0
    while retries < MAX_RETRIES:
        try:
            async with pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        "SELECT feedback, datetime FROM patient_feedback "
                        "WHERE patient_id = %s AND treatment = %s",
                        (patient_id, treatment)
                    )
                    history = await cur.fetchall()
                    logger.debug(f"Found {len(history)} historical records")

                    history_text = "- " + "\n- ".join([f"{row['datetime']}: {row['feedback']}" for row in history]) if history else "No history"

                    prompt = f"""Historical feedbacks:
                    {history_text}

                    New feedback: {feedback}

                    If the patient's condition has worsened compared to previous feedback or if there is any indication of deterioration that requires medical intervention (and not just normal fluctuations), classify this as 'severe'. Return JSON with "is_severe" as "true" or "false"."""

                    result = await safe_ai_call(
                        client.chat.completions.create,
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "Medical severity analyst"},
                            {"role": "user", "content": prompt}
                        ],
                        response_format={"type": "json_object"}
                    )

                    if not result:
                        logger.warning("No result from severity analysis")
                        return "false"

                    response = json.loads(result.choices[0].message.content)
                    return "true" if response.get('is_severe', False) else "false"
                
        except Exception as e:
            retries += 1
            if retries < MAX_RETRIES:
                logger.warning(f"Database connection failed (attempt {retries}/{MAX_RETRIES}): {str(e)}. Retrying...")
                time.sleep(RETRY_DELAY)
            else:
                logger.error(f"Severity analysis error after {MAX_RETRIES} retries: {str(e)}")
                return "false"


async def classify_feedback_type(feedback: str) -> str:
    """Classification with schema validation"""
    logger.info(f"Classifying feedback: {feedback}...")
    try:
        result = await safe_ai_call(
            client.chat.completions.create,
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Classify the user's feedback into one of the following categories: "
                        "treatment or service. Consider that treatment refers to "
                        "a medical or therapeutic procedure."
                        "Respond with only the category name (treatment or service)."
                    )
                },
                {"role": "user", "content": feedback}
            ],
            temperature=0
        )
        
        if not result:
            logger.warning("No result from classification")
            return "treatment"
            
        response = result.choices[0].message.content.lower().strip()[:45]
        if response not in {'treatment', 'service', 'medication'}:
            logger.warning(f"Invalid classification: {response}")
            return "treatment"
        return response
        
    except Exception as e:
        logger.error(f"Classification failed: {str(e)}")
        return "treatment"


async def store_feedback(data: dict) -> bool:
    """Database operation with schema compliance, validation, and severity handling"""
    try:
        success = True
        # Generate values with fallbacks
        data["datetime"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")[:45] or "1970-01-01 00:00:00"
        data["feedback_type"] = (await classify_feedback_type(data["feedback"]) or "treatment")[:45]
        data["is_severe"] = (await analyze_severity(
            data["patient_id"], 
            data["treatment"], 
            data["feedback"]
        ) or "false")[:45]

        logger.info("Validating fields before insertion:")
        logger.info(f"datetime: {data['datetime']}")
        logger.info(f"feedback_type: {data['feedback_type']}")
        logger.info(f"is_severe: {data['is_severe']}")

        # Check if severity requires immediate action
        if data["is_severe"] == "true":
            # 1. Notify doctor and send a response to the user
            assistant_response = "We have noticed your feedback and have notified the doctor to pay attention to it."
            logger.info(f"Assistant response: {assistant_response}")

            # 2. AI-generated treatment suggestions for the doctor
            suggested_treatment = await generate_treatment_suggestions(
                data["patient_id"], 
                data["treatment"], 
                data["feedback"]
            )
            logger.info(f"Suggested treatment: {suggested_treatment}")

            # 3. Store the user's feedback and suggested treatment in the doctor's mailbox table
            await store_in_doctor_mailbox_table(data, suggested_treatment)
            logger.info("Feedback and suggested treatment stored in doctor's mailbox table.")

        # Final validation
        if not all([
            re.match(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$', data["datetime"]),
            data["feedback_type"] in ["treatment", "service", "medication"],
            data["is_severe"] in ["true", "false"]
        ]):
            logger.error("Field validation failed")
            return False

        # Inserting validated data into the patient_feedback table
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """INSERT INTO patient_feedback 
                    (patient_id, treatment, feedback, datetime, is_severe, feedback_type)
                    VALUES (%s, %s, %s, %s, %s, %s)""",
                    (
                        data["patient_id"],
                        data["treatment"],
                        data["feedback"],
                        data["datetime"],
                        data["is_severe"],
                        data["feedback_type"]
                    )
                )
                await conn.commit()
                logger.info("Insert patient_feedback successful")
                # return True
                return {
                    "success": success,
                    "is_severe": data["is_severe"],
                    "assistant_response": "No immediate action required." if data["is_severe"] == "false" else "Immediate action recommended.",
                    "suggested_treatment": "Monitor the situation." if data["is_severe"] == "false" else "Consult a doctor as soon as possible."
                }
    
    except aiomysql.Error as e:
        logger.error(f"Database error: {str(e)}")
        return {"success": False, "is_severe": "false", "assistant_response": "No immediate action required.", "suggested_treatment": "No suggested treatment provided."}
    except Exception as e:
        logger.error(f"Error while storing feedback: {e}")
        return {"success": False, "is_severe": "false", "assistant_response": "No immediate action required.", "suggested_treatment": "No suggested treatment provided."}


async def generate_treatment_suggestions(
    patient_id: str, treatment: str, feedback: str
) -> str:
    """Generate treatment suggestions for the doctor based on current and historical information"""
    prompt = f"""
    The patient (ID: {patient_id}) has provided the following feedback regarding their treatment: 
    Treatment: {treatment}
    Feedback: {feedback}

    Based on the feedback and historical context (which should be checked if needed), 
    suggest a treatment plan for the doctor. If the situation requires immediate attention or 
    escalation, please provide the doctor's recommended course of action for treatment.
    Provide the suggestions in clear medical terms, focused on improving the patient's condition.
    The response should be in JSON format, including a "suggestions" field.
    """

    result = await safe_ai_call(
        client.chat.completions.create,
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "Medical treatment assistant. Respond in JSON format with 'suggestions'."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    if result:
        response = json.loads(result.choices[0].message.content)
        return response.get('suggestions', 'No suggestions provided')
    else:
        logger.warning("No result from treatment suggestions AI")
        return "No suggestions provided"


# Function to send request asynchronously and ignore timeouts
def send_request(mock_data):
    try:
        response = requests.post(writing_url, json=mock_data, headers={"Content-Type": "application/json"}, timeout=5)
        logger.info(response)
        # logging.info("POST request sent successfully.")
    except requests.exceptions.Timeout:
        pass  # Ignore timeout errors completely
    except requests.exceptions.RequestException as e:
        logging.error("An error occurred: %s", e)


# Asynchronous function to store feedback in doctor_message_hub table
async def store_in_doctor_mailbox_table(data: dict, suggested_treatment: str) -> None:
    """Store the user's feedback and suggested treatment in the doctor_message_hub table"""
    try:
        # Generate missing values if needed
        doctor_id = int(data.get("doctor_id", random.randint(1, 100)))
        doctor_sent = int(data.get("doctor_sent", 0))
        patient_id = int(data.get("patient_id", random.randint(1, 100)))
        clinical_staff_id = int(data.get("clinical_staff_id", random.randint(1, 100)))
        logger.info(type(suggested_treatment))
        # message = json.dumps({
        #     "feedback": data["feedback"],
        #     "suggested_treatment": suggested_treatment
        # }, ensure_ascii=False)
        
        # Build message as JSON string
        message = {
            "feedback": data["feedback"],
            "suggested_treatment": suggested_treatment  # must be a dict
        }
        message = json.dumps(message, ensure_ascii=False)
        logger.info(message)
        logger.info(type(message))
        # send_time = data.get("datetime", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

        # async with pool.acquire() as conn:
        #     async with conn.cursor() as cur:
        #         await cur.execute(
        #             """INSERT INTO nkw2tiugv6ufu1z.doctor_message_hub_v2 
        #             (doctor_id, doctor_sent, patient_id, clinical_staff_id, message, send_time) 
        #             VALUES (%s, %s, %s, %s, %s, %s)""",
        #             (doctor_id, doctor_sent, patient_id, clinical_staff_id, message, send_time)
        #         )
        #         await conn.commit()
        #         logger.info("Stored in doctor_message_hub table.")

        # Prepare data for API request
        mock_data = {
            "doctor_id": doctor_id,
            "doctor_sent": doctor_sent,
            "patient_id": patient_id,
            "clinical_staff_id": clinical_staff_id,
            "message": message
        }
        logger.info("Data prepared for API request:" + str(mock_data))
        # Run API request in a separate thread
        threading.Thread(target=send_request, args=(mock_data,)).start()
        logger.info("Data sent to doctor_message_hub API.")

    except Exception as e:
        logger.error(f"Error storing in doctor's mailbox table: {str(e)}")


@app.post("/chatbot/")
async def handle_chat_request(query: ChatQuery):
    """Endpoint with enhanced error handling"""
    try:
        logger.info(f"New request: {query.message}")
        
        # Extract feedback data from the user's message
        feedback_data = await extract_feedback_data(query.message)

        # If no feedback data could be extracted, ask for more info
        if not feedback_data:
            logger.warning("Failed to extract data, requesting more info")
            return {"response": "Please provide your Patient ID, Treatment received, and Feedback"}
        
        logger.info("Extracted data:")
        logger.info(feedback_data)
        
        # Store feedback data and check if severity requires special handling
        result = await store_feedback(feedback_data)

        # If feedback could not be stored, return an error message
        if not result.get("success"):
            logger.error("Failed to store feedback")
            return {"response": "We encountered an issue saving your feedback"}
        
        # If the severity flag is set to "true", return assistant's response and suggested treatment
        if result.get("is_severe") == "true":
            assistant_response = result.get("assistant_response", "No immediate action required.")
            suggested_treatment = result.get("suggested_treatment", "No suggested treatment provided.")
            
            return {
                "response": "Thank you for your feedback! We have notified the doctor.",
                "assistant_response": assistant_response,
                "suggested_treatment": suggested_treatment
            }
            
        return {"response": "Thank you for your feedback!"}
        
    except Exception as e:
        logger.error(f"Endpoint error: {str(e)}")
        return {"response": "An error occurred processing your request"}
file_handler.close()


if __name__ == "__main__":
    import uvicorn
    import os
    print(os.getcwd())
    with open("patient_feedback1.log", "a", encoding="utf-8") as f:
        f.write("Test log entry\n")
    logging.getLogger("uvicorn").handlers.clear()
    uvicorn.run(app, host="0.0.0.0", port=8000)
