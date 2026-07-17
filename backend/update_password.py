import os
import sys
from firebase_admin import auth

# Initialize firebase
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.firebase import get_db

def update_password():
    get_db() # Ensure firebase is initialized
    email = "shivashankrmali7@gmail.com"
    new_password = "Shivmali@123"
    
    try:
        user_record = auth.get_user_by_email(email)
        auth.update_user(
            user_record.uid,
            password=new_password
        )
        print(f"Successfully updated password for {email} to {new_password}")
    except Exception as e:
        print(f"Failed to update password: {e}")

if __name__ == "__main__":
    update_password()
