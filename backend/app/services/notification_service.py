import logging
from typing import Optional

# Set up a logger to output our "notifications" to the terminal
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Mock function to send an email. 
    For production, replace this logic with smtplib, SendGrid, or AWS SES.
    """
    logger.info("\n" + "="*40)
    logger.info(f"📧 EMAIL NOTIFICATION DISPATCHED")
    logger.info(f"To:      {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body:\n{body}")
    logger.info("="*40 + "\n")
    return True

def send_sms(phone_number: str, body: str) -> bool:
    """
    Mock function to send an SMS.
    For production, replace this logic with Twilio or AWS SNS.
    """
    logger.info("\n" + "="*40)
    logger.info(f"📱 SMS NOTIFICATION DISPATCHED")
    logger.info(f"To:      {phone_number}")
    logger.info(f"Message: {body}")
    logger.info("="*40 + "\n")
    return True

def notify_complaint_status_change(user_email: str, complaint_title: str, new_status: str, phone_number: Optional[str] = None):
    """
    Business logic: Alerts a citizen when an Official or Worker updates their complaint.
    """
    subject = f"SmartCity Connect: Update on '{complaint_title}'"
    body = f"Hello,\n\nThe status of your civic issue '{complaint_title}' has been updated to: {new_status}.\n\nLog in to your SmartCity dashboard for more details."
    
    send_email(to_email=user_email, subject=subject, body=body)
    
    if phone_number:
        sms_body = f"SmartCity Connect: Your complaint '{complaint_title}' is now '{new_status}'."
        send_sms(phone_number=phone_number, body=sms_body)

def notify_worker_assignment(worker_email: str, complaint_title: str, address: str):
    """
    Business logic: Alerts a field worker when an Official assigns them a new task.
    """
    subject = "SmartCity Connect: New Task Assignment"
    body = f"Hello,\n\nYou have been assigned a new field task: '{complaint_title}' at {address}.\n\nPlease check your worker dashboard to view the issue details and log your resolution."
    
    send_email(to_email=worker_email, subject=subject, body=body)