# Performance And Capacity Audit

## Code status
- frontend compiles cleanly
- no known build blocker

## Infra limitation
- auth concurrent capacity is constrained by Supabase plan and auth connection settings
- scaling to 50 or 100 concurrent logins is infra work, not just code work

## Recommendation
- upgrade infra before broad public opening
