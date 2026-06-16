# Multi User Capacity Plan

## Current situation
- auth and connection capacity depend heavily on Supabase plan and auth settings
- code optimization alone does not raise hard auth connection caps

## Founder actions
- increase auth connection budget or plan if needed
- review rate limits
- review SMTP and auth performance settings
- monitor concurrent sessions and refresh spikes

## Honest position
- V2 can be code-ready while platform capacity remains infra-limited
