# Breakthrough app: setup guide

One app for everyone. Self-paced clients see the Breakthrough Companion. 1:1 clients see the same thing **plus** their 1:1 home, the Representational System Test and the ECT page. You get a private coach dashboard.

| Link | Who it's for |
|---|---|
| `yourdomain/1to1` | 1:1 clients (lands on their 1:1 home) |
| `yourdomain/course` | Self-paced course customers (lands on the Companion) |
| `yourdomain/admin` | You only |

What a client can see is set by **you** in the dashboard, not by the link. The link only changes the welcome wording on the login screen, so a self-paced client who finds the 1:1 link still only sees the Companion.

---

## Step 1: Supabase (logins + database), about 15 min

1. Go to supabase.com, sign up, and click **New project**.
   - Name: `breakthrough`
   - Region: **Sydney (ap-southeast-2)**
   - Save the database password somewhere safe.
2. When it's ready, open **SQL Editor → New query**. Paste in everything from `supabase/schema.sql` and press **Run**.
   - The admin email in that file is `savannah@colourmeneurospicy.com.au`. If you'll log in with a different email, change it in the file before you run it.
3. Go to **Authentication → Emails → Magic Link** and replace the email body with this:
   ```html
   <h2>Your Breakthrough login code</h2>
   <p>Pop this code into the app:</p>
   <p style="font-size:32px;letter-spacing:6px"><b>{{ .Token }}</b></p>
   <p>It expires in an hour. Didn't ask for it? Ignore this email.</p>
   ```
   Clients get a 6-digit code instead of a link. This matters on iPhone: a link would open in Safari instead of in the home screen app, and they'd end up logged in to the wrong place.
4. **Authentication → Sign In / Providers → Email**: make sure Email is turned on.
5. **Before real clients use it**, set up your own email sending under **Authentication → Emails → SMTP Settings**. Supabase's built-in sender only allows a few emails an hour. A free Resend account works, and so does your email host's SMTP details.
6. Go to **Project Settings → API** and copy two things:
   - the **Project URL**
   - the **anon public** key

   Paste them into `public/js/config.js`.

## Step 2: GitHub (where the code lives), about 5 min

1. Make a free account at github.com.
2. Create a **private** repository called `breakthrough-app`.
3. Upload everything in this folder to it. Claude can do this part for you, and from then on it pushes changes there.

## Step 3: Netlify (hosting), about 10 min

1. Sign up at netlify.com using your GitHub login.
2. Choose **Add new site → Import an existing project**, then pick `breakthrough-app`.
   - Build command: *(leave empty)*
   - Publish directory: `public`

   Deploy.
3. Go to **Site configuration → Environment variables** and add:
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the same two values as in config.js)
   - `ANTHROPIC_API_KEY`: from console.anthropic.com. This powers the "AI Coach Sav" buttons. Skip it to leave the AI buttons switched off.
   - Optional: `AI_DAILY_LIMIT`, the number of AI uses per client per day (default 40)
   - Optional: `ANTHROPIC_MODEL`, which AI model to use
4. Go to **Domain management → Add a domain** and enter `app.savannahdenny.com.au`. Netlify shows you one DNS record to add where your domain is managed. HTTPS turns on automatically.
5. In Supabase, go to **Authentication → URL Configuration** and set **Site URL** to `https://app.savannahdenny.com.au`.

From now on, every change pushed to GitHub goes live on its own in about a minute.

## Step 4: First login

1. Open `app.savannahdenny.com.au/admin` and log in with your email. You're the admin automatically.
2. Under **Add a client**, add each 1:1 client's email as "1:1 client". Then send them the `/1to1` link.
3. Under **App settings**, paste your video links (YouTube, Vimeo, Bunny or Loom). They play inside the app.

## What clients do

1. Open their link in Safari.
2. Tap **Share → Add to Home Screen**.
3. Open the new icon and log in with the code from their email.

Their answers save to their account and to their phone, so they're kept even if they lose the phone or log in somewhere else. **Menu → Back up my answers** saves a copy file they can keep.

---

## For Claude / developers

- `src/companion.html` and `src/one-on-one.html` are the original artifacts.
- `python3 tools/build.py` merges them into `public/index.html`.
- Edit views in `src/` and rebuild, or edit `public/index.html` directly once you've stopped re-importing from the artifacts.
- `public/js/shell.js` handles login (Supabase email OTP), the localStorage→`client_data` sync (each localStorage key = one row), the role-based menu and router, the video embed player, the `window.claude.use('sample')` replacement (`netlify/functions/ai.js`), and backup/restore.
- `public/js/admin.js` is the coach dashboard. The `TOOLS` map gives saved keys their friendly names.
- 1:1-only views are flagged `private: true` in the merge script and blocked for self-paced accounts.
- Database security rules (RLS) in `supabase/schema.sql`: each client can only read and write their own rows. Admin can read everything. Coach notes and invites are admin-only.
