BEGIN;

ALTER TABLE public.emergencies
    ADD COLUMN IF NOT EXISTS incident_report_id INTEGER
        REFERENCES public.incident_reports(id);

CREATE UNIQUE INDEX IF NOT EXISTS
    uq_emergencies_incident_report_id
    ON public.emergencies (incident_report_id)
    WHERE incident_report_id IS NOT NULL;

COMMIT;