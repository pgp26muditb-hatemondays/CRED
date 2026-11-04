# Compass · Smart Stack prototype

Static site plus one serverless function.

- `index.html`: the full prototype (desktop app)
- `mobile.html`: the phone walkthrough ("See mobile demo" opens it in a new tab)
- `api/ai.js`: lets the AI planners call Google Gemini

## Deploy
1. Push this folder's contents to the root of a GitHub repo. Do not add your API key to any file.
2. In Vercel: Add New → Project → import the repo. No build settings needed.
3. Vercel → Project → Settings → Environment Variables → add
   `GEMINI_API_KEY` = your Gemini key. Then Deployments → Redeploy.
   Without it, the site still works and the planners give built-in answers.

Optional variables:
- `GEMINI_MODEL`: model name (default `gemini-3.8-flash`)
- `GEMINI_URL`: a different endpoint base URL, if your key is for Vertex AI
  (e.g. `https://aiplatform.googleapis.com/v1/publishers/google/models`)

Note: the API route is public, so anyone who finds the site can use your key's
quota. Set a usage cap in Google AI Studio / Cloud Console and delete the key
after the competition.
