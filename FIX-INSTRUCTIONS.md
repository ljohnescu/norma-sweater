# Targeted image fix

This update is based on the ORIGINAL (mostly working) project, not the revised one.

## What changed
- The 3 homepage photos are embedded in the JavaScript bundle. They no longer depend on public/reference being uploaded to GitHub correctly.
- All 20 sweater image URLs and the existing local-file → Superhuman fallback logic are UNCHANGED.
- Added `/image-check` to test each combination from the live deployed website, showing its number and yarn names, and copy a report.
- Supabase setup, environment variables, votes, and admin functionality are unchanged.

## Deploy
Replace the files in the GitHub repository with the contents of this ZIP (including reference-photos.js), commit, and let Vercel deploy. Do not change Supabase.
Then visit https://norma-sweater.vercel.app/image-check and click Copy report. Share the results to identify the specific broken URL(s).

Do not use the older `norma-sweater-voting-site-revised.zip` file.
