import requests
import threading
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# API endpoint
url = "https://e-react-node-backend-22ed6864d5f3.herokuapp.com/table/doctor_message_hub"

# Properly formatted mock data
mock_data = {'doctor_id': 58, 'doctor_sent': 1, 'patient_id': 1001, 'clinical_staff_id': 21, 'message': 'test message'}

# Headers
headers = {
    "Content-Type": "application/json"
}

# Function to send the request asynchronously and ignore timeouts
def send_request():
    try:
        response = requests.post(url, json=mock_data, headers=headers, timeout=5)
        logging.info("POST request sent successfully.")
    except requests.exceptions.Timeout:
        pass  # Ignore timeout errors completely
    except requests.exceptions.RequestException as e:
        logging.error("An error occurred: %s", e)

# Run the request in a separate thread
threading.Thread(target=send_request).start()
