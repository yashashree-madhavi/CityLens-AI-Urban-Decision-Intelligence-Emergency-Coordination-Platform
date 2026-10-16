from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError

from app.database.database import SessionLocal
from app.models.user import User
from app.security.auth import SECRET_KEY, ALGORITHM
from app.websocket.manager import manager

router = APIRouter(
    prefix="/ws",
    tags=["WebSocket"]
)


def _is_admin_token(token: str | None) -> bool:
    """Return True only if the JWT is valid and belongs to an admin."""
    if not token:
        return False

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return False
    except JWTError:
        return False

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user is not None and user.role == "admin"
    finally:
        db.close()


@router.websocket("/admin")
async def admin_websocket(
    websocket: WebSocket,
    token: str | None = None
):
    # Browsers cannot send an Authorization header on WebSockets,
    # so the admin dashboard passes its JWT as ?token=...
    if not _is_admin_token(token):
        await websocket.close(code=1008)
        return

    await manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)
