-- Migración para almacenar el ID del evento de Google Calendar
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS app_calendar_event_id VARCHAR(255);

