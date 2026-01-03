-- Add AppEUI and AppKey columns to devices table
-- Migration: 20260102_add_app_credentials
-- Description: Add app_eui and app_key columns for LoRaWAN device credentials

ALTER TABLE devices ADD COLUMN app_eui TEXT NOT NULL DEFAULT '';
ALTER TABLE devices ADD COLUMN app_key TEXT NOT NULL DEFAULT '';
