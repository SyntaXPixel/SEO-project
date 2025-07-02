import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Email Configuration
EMAIL_CONFIG = {
    'SMTP_SERVER': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
    'SMTP_PORT': int(os.getenv('SMTP_PORT', '587')),
    'EMAIL_ADDRESS': os.getenv('EMAIL_ADDRESS', 'nexus.track.verify@gmail.com'),
    'EMAIL_PASSWORD': os.getenv('EMAIL_PASSWORD', 'ewkyepdmtumxxmlj')
}

# OTP Configuration
OTP_CONFIG = {
    'LENGTH': 6,
    'EXPIRY_MINUTES': 1,
    'MAX_ATTEMPTS': 3
}

# MongoDB Configuration
MONGODB_CONFIG = {
    'URI': os.getenv('MONGODB_URI', 'mongodb+srv://test:test@venkatesh.nvutauw.mongodb.net/?retryWrites=true&w=majority'),
    'DATABASE': 'user_db'
} 