# Compass · Smart Stack prototype

Static site plus one serverless function.

- `index.html`: the full prototype (desktop app)
- `mobile.html`: the phone walkthrough ("See mobile demo" opens it in a new tab)
- `api/ai.js`: lets the AI planners call Google Gemini
- `vercel.json`: gives the AI function up to 60 seconds
- `hero.mp4`, `hero-poster.jpg`: the intro film (CRED's), shown before sign-in

## Deploy
1. Push this folder's contents to the root of a GitHub repo. Do not add your API key to any file.
2. In Vercel: Add New → Project → import the repo. No build settings needed.
3. Vercel → Project → Settings → Environment Variables → add
   `GEMINI_API_KEY` = your Gemini key. Then Deployments → Redeploy.
   Without it, the site still works and the planners give built-in answers.

Optional variables:
- `GEMINI_MODEL`: model name (default `gemini-2.5-flash`, chosen for speed)
- `GEMINI_FALLBACKS`: models to try if the main one is busy (default `gemini-2.5-flash,gemini-flash-lite-latest,gemini-3.5-flash`)
- `GEMINI_TIMEOUT_MS`: how long to wait for one model before trying the next (default 20000)
- `GEMINI_URL`: a different endpoint base URL, if your key is for Vertex AI
  (e.g. `https://aiplatform.googleapis.com/v1/publishers/google/models`)

Note: the API route is public, so anyone who finds the site can use your key's
quota. Set a usage cap in Google AI Studio / Cloud Console and delete the key
after the competition.

## Keep the site private
The intro film belongs to CRED and is included only for a private case-competition
presentation. Before sharing the link: Vercel → Project → Settings → Deployment Protection →
turn on Vercel Authentication (or Password Protection), and keep the GitHub repo private.
To remove the film, delete `hero.mp4`; the site falls back to the code-drawn intro.
