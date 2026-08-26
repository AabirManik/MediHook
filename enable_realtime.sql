-- Enable Realtime for the sos_events table so Caregivers get instant alerts
ALTER PUBLICATION supabase_realtime ADD TABLE sos_events;
