# Signup Flow — Install Instructions

## Files to copy into your brandgeo repo

| Source (here)                                  | Destination (brandgeo repo)                          |
|------------------------------------------------|------------------------------------------------------|
| `netlify/functions/signup-client.js`           | `netlify/functions/signup-client.js`                 |
| `src/pages/Signup.tsx`                         | `src/pages/Signup.tsx`                               |

---

## 1. App.tsx — add public /signup route

Open `src/App.tsx`. Find the import block and add:

```tsx
import Signup from './pages/Signup'
```

Then find where your routes are defined (inside `<Routes>` or `<Switch>`).
Add this **before** any PrivateRoute wrapper so it's accessible without login:

```tsx
<Route path="/signup" element={<Signup />} />
```

It should sit alongside the login route, which is also public:

```tsx
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />   {/* ← add this */}
```

---

## 2. Login.tsx — add "Don't have an account?" link

Open `src/pages/Login.tsx`. Find the bottom of the form/card and add this below the submit button:

```tsx
<p style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
  Don't have an account?{' '}
  <Link to="/signup">Sign up free</Link>
</p>
```

Make sure `Link` is imported at the top:
```tsx
import { Link } from 'react-router-dom'
```

---

## 3. Supabase dashboard settings (REQUIRED)

Go to your Supabase project → Authentication → URL Configuration:

- **Site URL**: `https://app.getbrandgeo.com`
- **Redirect URLs**: add `https://app.getbrandgeo.com/*`

This tells Supabase where to redirect users after they click the confirmation email link.

Also confirm under Authentication → Email:
- **Enable email confirmations**: ON

---

## 4. netlify.toml — add timeout for signup function

In `netlify.toml`, add:

```toml
[functions."signup-client"]
  timeout = 15
```

---

## 5. Commit and deploy

```bash
git add netlify/functions/signup-client.js src/pages/Signup.tsx src/App.tsx src/pages/Login.tsx netlify.toml
git commit -m "feat: self-service signup flow"
git push
```

---

## How the flow works end-to-end

1. Visitor lands on getbrandgeo.com → clicks "Get started" or types domain + "Run Free Audit"
2. Redirected to `app.getbrandgeo.com/signup` (domain pre-filled if typed)
3. Fills in email + password + brand domain → submits
4. `signup-client.js` creates: Supabase auth user + `clients` row + `user_profiles` row
5. Supabase sends confirmation email automatically
6. User clicks confirmation link → redirected to `app.getbrandgeo.com` (logged in)
7. User lands on dashboard — their brand is set up, ready to run first collection
