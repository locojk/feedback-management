
# Patient Feedback Chatobot

## Tech Stack
- **Frontend**: React
- **Backend**: FastAPI (located in `/api`)
- **Deployment**:
  - Backend: [Heroku](https://patient-feedback-backend-9e3b0b5a10ed.herokuapp.com)
  - Frontend: TBD


## Backend API

### POST `/chatbot/`

This is the main endpoint that receives user feedback and returns assistant responses.

**Example:**
```bash
curl -X POST https://patient-feedback-backend-9e3b0b5a10ed.herokuapp.com/chatbot/ \
     -H "Content-Type: application/json" \
     -d '{"message": "1006. Treatment: Physical Therapy. Feedback: Excellent sessions but waiting times were too long."}'
```
Response:
```
{
  "response": "Thank you for your feedback! We have notified the doctor.",
  "assistant_response": "Immediate action recommended.",
  "suggested_treatment": "Consult a doctor as soon as possible."
}
```

## Project Structure
```
feedback-management/
├── api/                    # FastAPI backend application
│   ├── main.py             # Entry point for the backend server
│   ├── requirements.txt    # Backend dependencies
│   └── ...                 # Other backend-related files
│
├── src/                    # React frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/              # React pages/views
│   ├── App.js              # Main app component
│   └── index.js            # Entry point for React
│
├── public/                 # Static files for React (e.g., index.html)
├── package.json            # Frontend dependencies and scripts
├── README.md               # Project documentation
└── ...                     # Other configuration files

```



## Introduction

### **Feature Functions**  
These functions implement the core business logic of the application:  

- **Extracts feedback data from user input**  
  - Identifies patient ID, treatment type, and feedback content.  
  - Ensures correct data formatting and returns structured JSON data.  

- **Analyzes the severity of feedback**  
  - Determines if patient feedback indicates an urgent issue.  
  - Checks historical data to detect worsening conditions.  
  - Uses AI to evaluate severity and returns `"true"` or `"false"`.  

- **Classifies feedback type**  
  - Categorizes feedback as `"treatment"`, `"service"`, or `"medication"`.  

- **Stores feedback in the database**  
  - Saves structured feedback data after classification and severity analysis.  
  - Notifies doctors if the feedback is severe.  

- **Generates treatment suggestions**  
  - Uses AI to propose potential treatment improvements based on feedback.  
  - Provides suggestions for doctors to review.  

### **Technical Functions**  
These functions handle system architecture, database operations, logging, and error handling:  

- **Ensures safe AI API calls**  
  - Wraps AI function calls with timeout handling and error logging.  
  - Prevents API failures from disrupting the main workflow.  

- **Logs AI operations**  
  - Records AI-related activities, including inputs and returned results.  

- **Handles FastAPI startup and shutdown processes**  
  - Creates and cleans up the database connection pool.  

- **Stores notifications in the doctor’s mailbox**  
  - Saves severe feedback and AI-generated treatment suggestions for doctors.  

- **Configures CORS middleware**  
  - Enables secure cross-origin requests from the frontend.  

- **Manages logging system**  
  - Implements a rotating file handler to store logs efficiently.  
  - Records errors, warnings, and debug information for troubleshooting.  

These functions collectively enable patient feedback extraction, analysis, storage, and notification while leveraging AI for automatic classification and medical decision support.



## Getting Started

Frontend:

```bash
npm run dev
```

Backend:

```bash
cd api
uvicorn main:app --reload
```

