import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ---------------------------------------------------------
# SMTP Configuration
# ---------------------------------------------------------
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465 # SSL Port
SENDER_EMAIL = "shakthipravin09@gmail.com" # Replace with your Gmail
SENDER_PASSWORD = "qfoz cvmq ngiz xkmm" # Replace with your App Password

def generate_otp(length: int = 6) -> str:
    """Generates a secure, random N-digit numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(recipient_email: str, otp_code: str) -> bool:
    """
    Constructs and transmits the 2FA verification email to the user.
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = f"SmartCity Connect <{SENDER_EMAIL}>"
        msg['To'] = recipient_email
        msg['Subject'] = "SmartCity Connect - Security Verification Code"

        # The email body formatting
        body = f"""
        ACCESS ATTEMPT DETECTED
        
        Your secure verification code is: {otp_code}
        
        This code will expire in 5 minutes. Do not share this passcode with anyone, 
        including SmartCity administrators.
        """
        msg.attach(MIMEText(body, 'plain'))

        # Initialize secure SMTP connection and transmit
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
            
        print(f"--- OTP securely routed to {recipient_email} ---")
        return True
        
    except Exception as e:
        print(f"--- SMTP Transmission Failed: {e} ---")
        return False