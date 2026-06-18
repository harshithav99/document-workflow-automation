from app.database import SessionLocal, engine
from app.models import Base, User
from app.auth import get_password_hash

print("Creating database tables...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_data():
    if db.query(User).first():
        print("Database already has data. Skipping seed.")
        return

    print("Hashing passwords and creating users...")
    
    author = User(
        username="author_harshitha",
        password=get_password_hash("password123"), 
        role="author"
    )
    
    reviewer = User(
        username="reviewer_harshitha",
        password=get_password_hash("password123"), # Securely hashed!
        role="reviewer"
    )

    db.add(author)
    db.add(reviewer)
    db.commit()
    
    print("Seed complete! You can now log in with:")
    print("Username: author_harshitha | Password: password123")
    print("Username: reviewer_harshitha | Password: password123")

if __name__ == "__main__":
    seed_data()
    db.close()