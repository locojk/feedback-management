
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

