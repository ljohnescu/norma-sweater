# Norma sweater — voting website

A mobile-first public 20-combination yes/no poll, plus a private organizer dashboard. Built with Vite + Supabase and hosted on Vercel.

## What's already included

- All 20 ordered combinations from the **Color A**, **Color B**, and **Picture** columns of the Superhuman Docs table, in `combinations.json`.
- All three welcome-page reference photos in `public/reference/`.
- One sweater image at a time, no yarn names or results displayed to voters, previous-button editing, review/submit, and thank-you page.
- Votes are **only saved in Supabase after the visitor taps “Submit my votes”**. Until then, their draft is stored on their own browser.
- Private `/admin` dashboard with sign-in, vote counts, percentage, color names and images, sorted by yes votes.
- The anonymous browser cannot read ballots or organizer results; the database enforces access control.

## Step 1 — Create the Supabase database (free tier)

1. Sign up at https://supabase.com and choose **New project**. Name it something like `norma-votes`. Save your database password somewhere safe.
2. Wait for the project to finish provisioning. Open **SQL Editor → New query**.
3. Copy the **entire** contents of `supabase/setup.sql` into the editor and click **Run**.
4. Open **Authentication → Users**. Create an organizer user using your email address and a strong password. (Use **Add user**; if available, mark the email confirmed.) This is **your** login only; voters do not need accounts.
5. Go back to **SQL Editor** and run the final `insert into public.admin_users...` statement from the bottom of `supabase/setup.sql`, replacing `YOUR_EMAIL@example.com` with the organizer email. This grants your account access to the dashboard. It should insert 1 row.
6. Open **Project Settings → API** (or **Connect → API keys** depending on the dashboard version). Copy the **Project URL** and the **publishable key** (or legacy `anon` public key). **Never use the `service_role` or secret key in Vercel.**

## Step 2 — Create a GitHub repository

1. Unzip the supplied project on your computer.
2. Create a new **private** GitHub repository, e.g. `norma-sweater-votes`.
3. Upload the project files to the repository, keeping folders intact. Or use the terminal:

   ```bash
   git init
   git add .
   git commit -m "Build Norma sweater poll"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/norma-sweater-votes.git
   git push -u origin main
   ```

   If you use GitHub's website, choose **Add file → Upload files** and drag in the *contents* of the unzipped project folder. Keep the directory structure.

## Step 3 — Deploy on Vercel (free Hobby tier)

1. Sign up at https://vercel.com (GitHub sign-in is easiest).
2. Choose **Add New → Project**, import your GitHub repository.
3. Vercel should detect **Vite** automatically. Framework Preset: **Vite**. Build command: `npm run build`; Output Directory: `dist`.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase **publishable / anon** key
5. Click **Deploy**. You'll receive a public URL such as `norma-sweater-votes.vercel.app`. The public survey is at `/`; your private organizer login is at `/admin`.
6. If you edit environment variables later, redeploy the project so the new values take effect.

## Step 4 — Important: make sure the 20 images are publicly accessible

The 20 image references came directly from the **Picture** column in Superhuman Docs. This project currently has their original hosted URLs as a fallback, **but those links may be access-controlled or expire**. I could not verify their public accessibility from the build environment.

**Recommended:** download the images once into your repository so Vercel serves them directly and reliably:

```bash
npm install
npm run fetch-images
```

This tries to download all 20 images to `public/combinations/1.png` through `20.png`. The script reports successes and failures. Commit and push the downloaded images to GitHub and Vercel will redeploy automatically.

If some fail, save each corresponding image from the Superhuman Docs table manually, naming them **`1.png`, `2.png`, ... `20.png`**, in the same `public/combinations/` folder. Use PNG files; if an image is saved as JPEG, convert it to PNG or update the `.local` extension in `src.js`. The image order in `combinations.json` is the table order. **Do not share the voting link until you have verified all 20 images on an incognito/private browser window.**

## Step 5 — Test before sharing

1. Open your Vercel link in a private/incognito browser window **without signing in**. Confirm the three welcome photos load.
2. Click Start and visit all 20 combinations. Confirm every image loads. Voters should see **no yarn names, no tallies**.
3. Vote on all 20 and press **Submit my votes**. You should see the thank-you page.
4. Open `https://YOUR-URL.vercel.app/admin` and sign in with the organizer email/password from Supabase.
5. Check that the dashboard says **1 completed ballot** and each combination has either one yes or one no. The counts should match your test choices.
6. Repeat the survey in a **different browser or private window**, submit a different ballot, and refresh `/admin`. The dashboard should now show **2 completed ballots** and updated totals. This verifies persistence across browsers/devices.
7. If you want to clear test ballots **before inviting people**, run `truncate table public.ballots;` in Supabase SQL Editor. This removes **all** submissions, so do this only before launch. Your test browsers will still remember completion; use another private window for subsequent tests.
8. Open `/admin` in a fresh incognito browser. It must require a login. A regular voter must not be able to access results.

## Notes on privacy, cost and repeat votes

- Vercel Hobby and Supabase Free should be enough for a personal poll. Free-tier limits and inactivity policies can change; check their current terms.
- Anyone with the public URL can submit a ballot. The database requires exactly 20 valid yes/no answers, but **does not guarantee one vote per person**. A completion flag in localStorage prevents accidental repeats in the same browser; clearing browser storage or using another browser allows another vote. This is appropriate for a casual friend/family poll, not a tamper-proof election.
- Anonymous visitors cannot retrieve individual ballots, and the admin dashboard's RPC checks the organizer's Supabase Auth user ID against the private `admin_users` table. Do not remove this check or publish your Supabase service-role key.
- The `combinations.json` data is part of the public website bundle, so technically curious visitors can inspect the yarn names via developer tools. Names are **not displayed in the voting UI**. Keeping the names secret even from technical users would require a different server-side architecture.
- Images from Superhuman Docs might be private; use the local-image instructions above for a reliable public launch.
- The project has not been deployed or live-tested against your Supabase account; follow the verification checklist before sharing.

## Run locally (optional)

```bash
npm install
cp .env.example .env
# Edit .env with the two Supabase values
npm run dev
```

Visit the local address printed by Vite. `/admin` is the private results page.
