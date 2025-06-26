from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
import sqlite3
from passlib.context import CryptContext

# =================
# Database Settings
# =================

DATABASE_URL = "student_registration.db"
SECRET_KEY = "CHANGE_THIS_IN_PROD"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# =================
# FastAPI Setup
# =================

app = FastAPI(
    title="Student Registration API",
    description="API for student signup, authentication, application form submission, "
                "status tracking, and DB health check.",
    version="1.0.0",
    openapi_tags=[
        {"name": "auth", "description": "User registration and authentication"},
        {"name": "application", "description": "Student application submission and status"},
        {"name": "health", "description": "Health check endpoint"},
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default bcrypt cost is 12 (good balance). Ensure not set higher by accident which causes slowness.
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# =================
# Pydantic Models
# =================

class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="User email for registration and login")
    password: str = Field(..., min_length=6, description="User password")


class UserInDB(BaseModel):
    id: int
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str


class ApplicationSubmit(BaseModel):
    program: str = Field(..., description="Program the student is applying for")
    full_name: str = Field(..., description="Full legal name of the applying student")
    dob: str = Field(..., description="Date of birth in YYYY-MM-DD format")
    additional_info: Optional[str] = Field(
        None, description="Any additional information"
    )


class ApplicationOut(BaseModel):
    id: int
    user_id: int
    program: str
    full_name: str
    dob: str
    status: str
    submit_time: str
    additional_info: Optional[str] = None


class ApplicationStatusOut(BaseModel):
    application_id: int
    status: str
    updated_at: str


# =================
# Utility Functions
# =================

def get_db_connection():
    # Set check_same_thread=False for multithreaded FastAPI (to avoid SQLite access serialization).
    conn = sqlite3.connect(DATABASE_URL, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Ensure connection is using WAL mode for better concurrency in production.
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
    except Exception:
        pass  # Compatibility fallback only
    return conn


def create_tables():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL
        );
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            program TEXT NOT NULL,
            full_name TEXT NOT NULL,
            dob TEXT NOT NULL,
            status TEXT DEFAULT 'Submitted',
            submit_time TEXT,
            additional_info TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        """
    )
    conn.commit()
    conn.close()


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_user_by_email(email: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    conn.close()
    return row


def authenticate_user(email: str, password: str):
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user['hashed_password']):
        return None
    return user


def get_user_from_token(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(email)
    if user is None:
        raise credentials_exception
    return user


# ===============================
# Application Startup Event
# ===============================

@app.on_event("startup")
def startup_event():
    create_tables()


# ===============================
# Public Endpoints
# ===============================

# PUBLIC_INTERFACE
@app.get(
    "/health",
    tags=["health"],
    summary="Check DB Health",
    description="Checks if the API can connect and query the SQLite database successfully."
)
def health_check():
    """
    Health check endpoint for DB and API.
    Returns 200 OK if DB connection works, else 503.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        conn.close()
        return {"status": "ok", "db": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database connection failed")


# PUBLIC_INTERFACE
@app.post(
    "/signup",
    tags=["auth"],
    response_model=UserInDB,
    summary="User Signup",
    description="Create a new student user."
)
def signup(user: UserCreate):
    """
    Create a new student user with email and password.
    """
    if get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (email, hashed_password) VALUES (?, ?)",
            (user.email, hashed_password)
        )
        user_id = cur.lastrowid
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    conn.close()
    return {"id": user_id, "email": user.email}


# PUBLIC_INTERFACE
@app.post(
    "/token",
    tags=["auth"],
    response_model=Token,
    summary="User Authentication",
    description="Authenticate user and return access token."
)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate and return JWT access token.
    """
    # Start profiling login performance for diagnostics.
    import time
    start_time = time.time()

    # Potential bottleneck 1: Password hash verification with bcrypt
    # -- If bcrypt is used with very high rounds or system is underpowered, this can cause delay.
    # -- Solution: Reduce bcrypt rounds to a reasonable secure-minimum if set higher by mistake.
    # Let's force bcrypt to use 12 rounds (default is usually 12; more causes slowdowns).
    if hasattr(pwd_context, "schemes"):
        # If there are explicit rounds settings, adjust accordingly.
        # Set bcrypt rounds lower ONLY if currently misconfigured.
        try:
            scheme = pwd_context.handler("bcrypt")
            if hasattr(scheme, "rounds") and getattr(scheme, "rounds") > 12:
                pwd_context.update(bcrypt__rounds=12)
        except Exception:
            pass

    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    elapsed = time.time() - start_time
    if elapsed > 2:
        # Log slow login response for further backend diagnostics (this would help in production/system logs)
        print(f"[Warning] Slow login response: {elapsed:.2f}s for user: {form_data.username}")

    return {"access_token": access_token, "token_type": "bearer"}


# PUBLIC_INTERFACE
@app.post(
    "/applications/",
    tags=["application"],
    response_model=ApplicationOut,
    summary="Submit Application",
    description="Student submits an application form."
)
def submit_application(application: ApplicationSubmit, user=Depends(get_user_from_token)):
    """
    Allows the logged-in student to submit an application form.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    now = datetime.utcnow().isoformat()
    cur.execute(
        (
            "INSERT INTO applications (user_id, program, full_name, dob, status, "
            "submit_time, additional_info) VALUES (?, ?, ?, ?, 'Submitted', ?, ?)"
        ),
        (
            user['id'],
            application.program,
            application.full_name,
            application.dob,
            now,
            application.additional_info,
        ),
    )
    app_id = cur.lastrowid
    conn.commit()
    cur.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
    row = cur.fetchone()
    conn.close()
    return ApplicationOut(
        id=row['id'],
        user_id=row['user_id'],
        program=row['program'],
        full_name=row['full_name'],
        dob=row['dob'],
        status=row['status'],
        submit_time=row['submit_time'],
        additional_info=row['additional_info']
    )


# PUBLIC_INTERFACE
@app.get(
    "/applications/",
    tags=["application"],
    response_model=List[ApplicationOut],
    summary="List My Applications",
    description="Get all applications submitted by the authenticated student."
)
def list_my_applications(user=Depends(get_user_from_token)):
    """
    Returns all applications submitted by the authenticated student.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        (
            "SELECT * FROM applications WHERE user_id = ? "
            "ORDER BY submit_time DESC"
        ),
        (user['id'],)
    )
    apps = cur.fetchall()
    conn.close()
    output_list = []
    for row in apps:
        output_list.append(
            ApplicationOut(
                id=row['id'],
                user_id=row['user_id'],
                program=row['program'],
                full_name=row['full_name'],
                dob=row['dob'],
                status=row['status'],
                submit_time=row['submit_time'],
                additional_info=row['additional_info'],
            )
        )
    return output_list


# PUBLIC_INTERFACE
@app.get(
    "/applications/{application_id}/status",
    tags=["application"],
    response_model=ApplicationStatusOut,
    summary="Get Application Status",
    description="Get the status and last update of a specific application by ID (must belong to authenticated user)."
)
def get_application_status(application_id: int, user=Depends(get_user_from_token)):
    """
    Checks the status of a specific application owned by the user.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, status, submit_time, user_id "
        "FROM applications WHERE id = ?",
        (
            application_id,
        )
    )
    row = cur.fetchone()
    conn.close()
    if (not row) or (row["user_id"] != user["id"]):
        raise HTTPException(status_code=404, detail="Application not found")
    return {
        "application_id": row["id"],
        "status": row["status"],
        "updated_at": row["submit_time"],
    }
