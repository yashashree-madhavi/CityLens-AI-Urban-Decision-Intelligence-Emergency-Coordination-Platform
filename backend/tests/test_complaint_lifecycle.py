import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup test environment before importing app
os.environ["SECRET_KEY"] = os.environ.get("SECRET_KEY", "test-secret-key-citylens-audit-12345")
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["DISABLE_SCHEDULERS"] = "true"
os.environ["TESTING"] = "true"

from app.database.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.incident_report import IncidentReport
from app.models.alert import Alert
from app.security.auth import create_access_token, get_current_user, require_role

# Isolated in-memory SQLite engine for tests so live database is never touched
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


class ComplaintLifecycleTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        cls.client = TestClient(app)

        # Create test users: 1 admin, 1 citizen
        db = TestingSessionLocal()
        cls.admin_user = User(
            name="Admin Officer",
            email="admin.officer@citylens.test",
            password_hash="test-hashed-pw",
            role="admin",
            latitude=19.076,
            longitude=72.877,
        )
        cls.citizen_user = User(
            name="Citizen Tester",
            email="citizen.tester@citylens.test",
            password_hash="test-hashed-pw",
            role="citizen",
            latitude=19.076,
            longitude=72.877,
        )
        db.add(cls.admin_user)
        db.add(cls.citizen_user)
        db.commit()
        db.refresh(cls.admin_user)
        db.refresh(cls.citizen_user)

        cls.admin_token = create_access_token({
            "sub": str(cls.admin_user.id),
            "email": cls.admin_user.email,
            "role": "admin",
        })
        cls.citizen_token = create_access_token({
            "sub": str(cls.citizen_user.id),
            "email": cls.citizen_user.email,
            "role": "citizen",
        })
        db.close()

    def setUp(self):
        self.db = TestingSessionLocal()

    def tearDown(self):
        self.db.close()

    def _create_incident(self, status="reported", verification_status="unverified"):
        incident = IncidentReport(
            user_id=self.citizen_user.id,
            incident_type="pothole",
            description="Deep pothole on SV Road junction",
            latitude=19.0800,
            longitude=72.8800,
            status=status,
            verification_status=verification_status,
            verification_method="rules",
            verification_reason="Initial test record",
            emergency_priority="normal",
        )
        self.db.add(incident)
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def test_unauthorized_user_cannot_update_operational_status(self):
        incident = self._create_incident()
        headers = {"Authorization": f"Bearer {self.citizen_token}"}
        response = self.client.patch(
            f"/incidents/{incident.id}/status?status=investigating",
            headers=headers,
        )
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_request_is_rejected(self):
        incident = self._create_incident()
        response = self.client.patch(
            f"/incidents/{incident.id}/status?status=investigating"
        )
        self.assertEqual(response.status_code, 401)

    def test_valid_operational_status_progression(self):
        incident = self._create_incident(status="reported")
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Step 1: reported -> investigating (valid)
        res1 = self.client.patch(
            f"/incidents/{incident.id}/status?status=investigating",
            headers=headers,
        )
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["status"], "investigating")

        # Step 2: investigating -> resolved (valid)
        res2 = self.client.patch(
            f"/incidents/{incident.id}/status?status=resolved",
            headers=headers,
        )
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["status"], "resolved")

    def test_invalid_operational_status_jump(self):
        incident = self._create_incident(status="reported")
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # reported directly to resolved without investigation is rejected
        res = self.client.patch(
            f"/incidents/{incident.id}/status?status=resolved",
            headers=headers,
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid status transition", res.json()["detail"])

    def test_resolved_terminal_state_cannot_be_modified(self):
        incident = self._create_incident(status="resolved")
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        for target in ["reported", "investigating", "rejected"]:
            res = self.client.patch(
                f"/incidents/{incident.id}/status?status={target}",
                headers=headers,
            )
            self.assertEqual(res.status_code, 409)
            self.assertIn("terminal state", res.json()["detail"].lower())

    def test_rejected_terminal_state_cannot_be_modified(self):
        incident = self._create_incident(status="rejected")
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        res = self.client.patch(
            f"/incidents/{incident.id}/status?status=investigating",
            headers=headers,
        )
        self.assertEqual(res.status_code, 409)

    def test_verified_decision_is_immutable(self):
        incident = self._create_incident(status="reported", verification_status="unverified")
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Step 1: Confirm report as verified
        res1 = self.client.patch(
            f"/incidents/{incident.id}/verification",
            headers=headers,
            json={"decision": "verified", "reason": "Confirmed by field photo match"},
        )
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["verification_status"], "verified")

        # Step 2: Attempting to change verification to needs_review must be rejected with 409
        res2 = self.client.patch(
            f"/incidents/{incident.id}/verification",
            headers=headers,
            json={"decision": "needs_review", "reason": "Change my mind"},
        )
        self.assertEqual(res2.status_code, 409)
        self.assertIn("terminal verification state", res2.json()["detail"])

        # Step 3: Attempting to change verification to rejected must also be rejected with 409
        res3 = self.client.patch(
            f"/incidents/{incident.id}/verification",
            headers=headers,
            json={"decision": "rejected", "reason": "Reject after verified"},
        )
        self.assertEqual(res3.status_code, 409)

    def test_rejected_verification_cannot_be_re_reviewed(self):
        incident = self._create_incident(status="reported", verification_status="unverified")
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        res1 = self.client.patch(
            f"/incidents/{incident.id}/verification",
            headers=headers,
            json={"decision": "rejected", "reason": "Spam submission"},
        )
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["verification_status"], "rejected")

        # Second review must fail
        res2 = self.client.patch(
            f"/incidents/{incident.id}/verification",
            headers=headers,
            json={"decision": "verified", "reason": "Try to verify rejected"},
        )
        self.assertEqual(res2.status_code, 409)

    def test_reopen_terminal_incident_with_audit_trail(self):
        incident = self._create_incident(status="resolved", verification_status="verified")
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Ordinary status update fails
        res_fail = self.client.patch(
            f"/incidents/{incident.id}/status?status=investigating",
            headers=headers,
        )
        self.assertEqual(res_fail.status_code, 409)

        # Dedicated auditable administrative reopen succeeds
        reopen_payload = {"reason": "Citizen reported water leak re-emerged post-repair"}
        res_reopen = self.client.post(
            f"/incidents/{incident.id}/reopen",
            headers=headers,
            json=reopen_payload,
        )
        self.assertEqual(res_reopen.status_code, 200)
        self.assertEqual(res_reopen.json()["status"], "investigating")

        # Verify audit trail appended to reason
        self.db.expire_all()
        updated = self.db.query(IncidentReport).filter(IncidentReport.id == incident.id).first()
        self.assertIn("REOPENED by Admin", updated.verification_reason)
        self.assertIn("Citizen reported water leak re-emerged", updated.verification_reason)


if __name__ == "__main__":
    unittest.main()
