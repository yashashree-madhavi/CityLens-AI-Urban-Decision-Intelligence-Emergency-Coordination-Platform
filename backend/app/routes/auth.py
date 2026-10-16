import os
import secrets

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.security.auth import (
    verify_password,
    create_access_token,
    get_current_user
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


@router.post("/register", response_model=UserResponse)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    # Check whether email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = pwd_context.hash(user_data.password)

    # Create new user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        role="citizen",  # public signup can NEVER create an admin
        latitude=user_data.latitude,
        longitude=user_data.longitude
    )

    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Find user by email
    user = (
        db.query(User)
        .filter(User.email == form_data.username)
        .first()
    )

    # Check user exists
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Check password
    if not verify_password(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT token
    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
        "email": user.email
    }


class AdminRegister(UserCreate):
    admin_code: str


@router.post("/register-admin", response_model=UserResponse)
def register_admin(
    data: AdminRegister,
    db: Session = Depends(get_db)
):
    """
    Create an admin account. Needs the secret ADMIN_SIGNUP_CODE
    from the backend .env file, so random people cannot become admins.
    """
    expected_code = os.getenv("ADMIN_SIGNUP_CODE")

    if not expected_code:
        raise HTTPException(
            status_code=403,
            detail="Admin signup is disabled. Set ADMIN_SIGNUP_CODE in backend/.env"
        )

    if not secrets.compare_digest(data.admin_code, expected_code):
        raise HTTPException(
            status_code=403,
            detail="Invalid admin code"
        )

    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_admin = User(
        name=data.name,
        email=data.email,
        password_hash=pwd_context.hash(data.password),
        role="admin",
        latitude=data.latitude,
        longitude=data.longitude
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return new_admin


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
