# Fix Google sign-in on Vercel

## Confirmed cause

The Google button currently starts authentication through a same-origin `~oauth/initiate` address. Lovable-hosted sites provide that address, but the Vercel deployment does not, so Vercel shows its 404 page before Google opens.

This is not caused by a missing Google key or password. No OAuth credentials should be shared in chat.

## Changes

1. Keep the existing managed Google sign-in flow for the Lovable preview and published Lovable site.
2. On externally hosted domains such as Vercel, start Google authentication directly through the app's existing cloud authentication client instead of the unavailable Lovable-hosted broker path.
3. Return users to the existing public `/auth` page, wait for the authenticated session, then continue to `/app` as the page already does.
4. Keep both existing “Continue with Google” buttons, styling, email/password flow, and all unrelated pages unchanged.
5. Verify that clicking Google no longer requests `/~oauth/initiate` on Vercel and that the existing Lovable preview flow still starts correctly.

## Deployment configuration

Use a stable Vercel production domain in the authentication redirect allow-list. A generated deployment address such as `timelysub-6ep2wwlzw-copious0420.vercel.app` can change between deployments and should not be the permanent return address.

If Google later reports a provider-specific credential error after the 404 is removed, configure a custom Google client in the Cloud authentication settings. That is a separate step; the current 404 does not require those credentials.
