import os
import sys
from firebase_admin import auth

# Initialize firebase
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.firebase import get_db, create_user_profile

def ensure_admin():
    db = get_db()
    email = "shivashankrmali7@gmail.com"
    
    # Check if user exists in auth
    try:
        # We can get user by email. Note: this returns the FIRST user found if multiple exist (which shouldn't happen unless linked or multiple accounts allowed)
        user_record = auth.get_user_by_email(email)
        uids = [user_record.uid]
        print(f"Found primary auth user: {user_record.uid}")
        
        # If they use multiple accounts per email, we can list all users and check
        for u in auth.list_users().iterate_all():
            if u.email == email and u.uid not in uids:
                uids.append(u.uid)
                print(f"Found additional auth user with same email: {u.uid}")
                
    except auth.UserNotFoundError:
        print(f"User {email} not found in Firebase Auth.")
        # We can create the user in auth so they can at least log in with manual password
        user_record = auth.create_user(
            email=email,
            password="Password123!",
            display_name="Admin User"
        )
        uids = [user_record.uid]
        print(f"Created new auth user for {email} with UID: {user_record.uid}")

    for uid in uids:
        # Create or overwrite profile in Firestore
        profile = {
            "email": email,
            "firstName": "Admin",
            "lastName": "User",
            "role": "admin",
            "organization": "CoralAI Admin"
        }
        create_user_profile(uid, profile)
        print(f"Successfully added/updated admin credentials in Firestore for UID: {uid}")

if __name__ == "__main__":
    ensure_admin()
