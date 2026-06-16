# Admin Security Notes

## Local behavior
- local bypass should stay local-only
- no real admin powers without server validation

## Public behavior expected
- admin pages require real session and admin role
- Product Lab real actions require server-side validation

## Red line
- never expose service role
- never trust client-only admin flags
