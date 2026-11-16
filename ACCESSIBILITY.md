# Interface and recovery checks

The interface uses Material Design 3 colour roles with a purple primary and neutral surfaces, adapted for enhanced text contrast. GOV.UK's functional colour and explicit form-message patterns inform focus and error handling.

References:
- https://m3.material.io/styles/color/the-color-system
- https://design-system.service.gov.uk/styles/colour/
- https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html

Automated tests check key text/background pairs against 7:1 and control outlines against 3:1 in light and dark themes. Compact layout reduces spacing, not base text size, and retains 44px minimum control targets. It is a per-device preference. Keyboard focus, reduced motion, labels, persistent recovery errors and a skip link are included.

These checks do not establish full WCAG AAA conformance. Manual screen-reader, keyboard, zoom/reflow, touch and browser checks remain required.

## Password recovery

Uses Supabase PKCE, resetPasswordForEmail, PASSWORD_RECOVERY, getUser and updateUser. The callback uses the site's root URL so it does not conflict with hash routing. Recovery events are handled before the existing same-user early return. A sessionStorage marker retains the form across reloads; it is only a UI preference and never substitutes for server authentication. Passwords are never stored by app code.

In Supabase Authentication URL Configuration, allow https://theflavourstash.github.io/ and use the same URL as the site URL. The reset email template should use the standard ConfirmationURL. Configured email delivery is needed. PKCE recovery links must be opened in the browser and device that requested them.

Manual checks: request an email for a test account; follow the newest link in the same browser; verify the new-password screen opens; test mismatch, expired and reused links; reset a password and verify login; check a new request after opening a link in another browser. No real password was changed and no reset email was sent during implementation.
