
BEGIN;

ALTER TABLE public.incident_reports
    ADD COLUMN IF NOT EXISTS evidence_image_path VARCHAR(500),
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30)
        NOT NULL DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS verification_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS verification_confidence DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS verification_reason TEXT,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verified_by INTEGER
        REFERENCES public.users(id),
    ADD COLUMN IF NOT EXISTS emergency_priority VARCHAR(20)
        NOT NULL DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ix_incident_reports_verification_status
    ON public.incident_reports (verification_status);

CREATE INDEX IF NOT EXISTS ix_incident_reports_emergency_priority
    ON public.incident_reports (emergency_priority);

COMMIT;
