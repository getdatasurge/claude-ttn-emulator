# Supabase Edge Functions

This directory contains Deno-based serverless edge functions for the FrostGuard LoRaWAN Emulator.

## Planned Functions

According to CLAUDE.md, the following 17 edge functions will be implemented:

### TTN Integration
- `ttn-simulate` - Send simulated uplinks to TTN
- `ttn-preflight` - Validate TTN config before simulation
- `ttn-webhook` - Receive webhook callbacks from TTN
- `manage-ttn-settings` - Test TTN API connection

### FrostGuard Sync
- `fetch-org-state` - Pull data from FrostGuard
- `sync-to-frostguard` - Push data to FrostGuard

### Additional Functions
- More functions to be added during development

## Development

To create a new edge function:

```bash
supabase functions new <function-name>
```

To deploy a function:

```bash
supabase functions deploy <function-name>
```

## Testing

Functions can be tested locally using:

```bash
supabase functions serve <function-name>
```
