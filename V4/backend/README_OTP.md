# OTP Email Verification Setup

This guide will help you set up email OTP verification for user registration.

## Prerequisites

1. **Gmail Account**: You'll need a Gmail account to send emails
2. **App Password**: Generate an app password for your Gmail account

## Setup Instructions

### 1. Generate Gmail App Password

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already enabled)
3. Go to **App passwords**
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

ewky epdm tumx xmlj 

```bash
# Email Configuration
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# MongoDB Configuration (optional - uses default if not set)
MONGODB_URI=mongodb+srv://test:test@venkatesh.nvutauw.mongodb.net/?retryWrites=true&w=majority
```

### 3. Install Required Packages

```bash
pip3 install python-dotenv
```

### 4. Update Configuration

If you want to use environment variables, update `config.py`:

```python
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Email Configuration
EMAIL_CONFIG = {
    'SMTP_SERVER': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
    'SMTP_PORT': int(os.getenv('SMTP_PORT', '587')),
    'EMAIL_ADDRESS': os.getenv('EMAIL_ADDRESS', 'your-email@gmail.com'),
    'EMAIL_PASSWORD': os.getenv('EMAIL_PASSWORD', 'your-app-password')
}
```

### 5. Test the Setup

1. Start the Flask server: `python3 app.py`
2. Try registering a new user
3. Check your email for the OTP

## Features

- ✅ **6-digit OTP generation**
- ✅ **10-minute expiry time**
- ✅ **Maximum 3 attempts per OTP**
- ✅ **Resend OTP functionality**
- ✅ **HTML email template**
- ✅ **User-specific project access**

## API Endpoints

### Registration Flow

1. **Send OTP**: `POST /api/send-otp`
   ```json
   {
     "email": "user@example.com"
   }
   ```

2. **Verify OTP**: `POST /api/verify-otp`
   ```json
   {
     "email": "user@example.com",
     "otp": "123456",
     "name": "John Doe",
     "password": "password123"
   }
   ```

3. **Resend OTP**: `POST /api/resend-otp`
   ```json
   {
     "email": "user@example.com"
   }
   ```

## Security Features

- OTP expires after 10 minutes
- Maximum 3 attempts per OTP
- Email verification required for registration
- User-specific project access
- Password hashing with Werkzeug

## Troubleshooting

### Common Issues

1. **"Failed to send OTP"**
   - Check your Gmail app password
   - Ensure 2-Step Verification is enabled
   - Verify SMTP settings

2. **"Invalid OTP"**
   - Check if OTP has expired (10 minutes)
   - Ensure you're using the latest OTP
   - Don't exceed 3 attempts

3. **"Email already registered"**
   - Use a different email address
   - Check if the email exists in the database

### Gmail Security Settings

- Enable "Less secure app access" (not recommended)
- Use App Passwords instead (recommended)
- Ensure your Gmail account allows SMTP access

## Production Considerations

1. **Use Redis** for OTP storage instead of in-memory
2. **Use environment variables** for sensitive data
3. **Implement rate limiting** for OTP requests
4. **Use a professional email service** like SendGrid or AWS SES
5. **Add logging** for debugging
6. **Implement proper error handling**

## Example Usage

```bash
# Test OTP sending
curl -X POST http://localhost:5001/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test OTP verification
curl -X POST http://localhost:5001/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","name":"Test User","password":"password123"}'
``` 