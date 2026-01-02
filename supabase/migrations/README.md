# Database Migrations

This directory contains PostgreSQL database migrations for the FrostGuard LoRaWAN Emulator.

## Migration Strategy

- Migrations are managed by Supabase CLI
- Each migration file follows the naming convention: `YYYYMMDDHHMMSS_description.sql`
- Migrations are applied in chronological order

## Creating Migrations

To create a new migration:

```bash
supabase migration new <description>
```

## Applying Migrations

Migrations are automatically applied when running:

```bash
supabase db reset  # Reset local database and apply all migrations
supabase db push   # Push migrations to remote Supabase project
```

## Key Tables (Planned)

According to CLAUDE.md, the database will include:

- Multi-tenant organization hierarchy
- TTN settings (with Row-Level Security)
- Device management
- Telemetry data
- User authentication and authorization

See CLAUDE.md for detailed schema design requirements.
