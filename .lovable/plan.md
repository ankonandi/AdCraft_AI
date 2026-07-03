## Plan

1. **Treat this as backend/auth availability, not UI code**
   - The failing request is an auth token refresh request returning `522`, which means the auth service did not respond in time.
   - I checked the hosted backend health; it is currently responding normally from Lovable Cloud’s side.
   - Recent auth logs did not show app-level errors for `/auth/v1/token`, which points away from a bad login form or route bug.

2. **Clear the broken browser session loop**
   - Add a small client-side guard around auth startup that detects repeated token-refresh failures and signs the local stale session out cleanly.
   - This avoids the app getting stuck repeatedly trying to refresh an invalid/hung session.
   - It will send the user back to login with a clear message instead of endless failed refresh requests.

3. **Keep the existing auth APIs unchanged**
   - Do not change backend auth configuration.
   - Do not override `fetch`, add CORS hacks, or alter the generated backend client.
   - Keep email/password login behavior as-is.

4. **Add a user-facing recovery message**
   - On the login page, if the app detects an expired/stuck session, show a simple message like: “Your session expired. Please sign in again.”
   - This is important for less technical users who would otherwise see only a stuck app.

5. **Verify after implementation**
   - Confirm the app no longer loops on refresh-token calls when the session is stale.
   - Confirm normal login flow still navigates to the signed-in home page.

## Technical notes

- Files likely involved:
  - `src/App.tsx` or a small new auth recovery component mounted globally
  - `src/pages/Auth.tsx` for the recovery message
- No database migration is needed.
- If `522` continues for fresh login attempts after clearing the local session, that is an infrastructure-side auth outage and should be escalated to Lovable support rather than patched in code.