# Neutral email templates (Supabase → Authentication → Email templates)

Rules (spec Sections 1, 12): subject and body must not reveal what the app is for. No mention of court,
child support, family, custody, or the other parent. Sender name: neutral (e.g. "Form Prep" or your
chosen neutral name). Set the sender under Authentication → SMTP settings (custom SMTP recommended for launch).

## Confirm signup
**Subject:** Confirm your account
```
Hello,

Please confirm your email address to finish creating your account:

{{ .ConfirmationURL }}

If you didn't create an account, you can ignore this email.
```

## Reset password
**Subject:** Reset your password
```
Hello,

Use this link to choose a new password:

{{ .ConfirmationURL }}

If you didn't ask to reset your password, you can ignore this email.
```

## Change email address
**Subject:** Confirm your new email address
```
Hello,

Please confirm your new email address:

{{ .ConfirmationURL }}
```

## Magic link / Invite
Not used. Leave disabled.
