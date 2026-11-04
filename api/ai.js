// Vercel serverless function: lets the prototype's AI planners call Google Gemini.
// Set GEMINI_API_KEY in Vercel → Project → Settings → Environment Variables. Never put the key in the code.
// Optional: GEMINI_MODEL (default gemini-3.8-flash), GEMINI_URL (full base URL, to use another endpoint).
// The page speaks a simple message format (text, tool_use, tool_result); this file translates it to Gemini and back.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const BASE = process.env.GEMINI_URL || "https://generativelanguage.googleapis.com/v1beta/models";

function cleanSchema(s) {
  if (!s || typeof s !== "object") return s;
  const o = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === "enum" && s.type !== "string") continue; // Gemini accepts enums on strings only
    o[k] = k === "properties" ? Object.fromEntries(Object.entries(v).map(([pk, pv]) => [pk, cleanSchema(pv)])) : typeof v === "object" && !Array.isArray(v) ? cleanSchema(v) : v;
  }
  if (s.enum && s.type !== "string") o.description = ((s.description || "") + " One of: " + s.enum.join(", ")).trim();
  return o;
}

function toContents(messages) {
  const names = {}, contents = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    if (typeof m.content === "string") { contents.push({ role, parts: [{ text: m.content }] }); continue; }
    const raw = m.content.find((b) => b.type === "gemini_parts");
    m.content.filter((b) => b.type === "tool_use").forEach((b) => (names[b.id] = b.name));
    if (raw) { contents.push({ role: "model", parts: raw.parts }); continue; }
    const parts = [];
    for (const b of m.content) {
      if (b.type === "text" && b.text) parts.push({ text: b.text });
      if (b.type === "tool_use") parts.push({ functionCall: { name: b.name, args: b.input || {}, ...(b.callId ? { id: b.callId } : {}) } });
      if (b.type === "tool_result") {
        let result; try { result = JSON.parse(b.content); } catch (e) { result = b.content; }
        parts.push({ functionResponse: { name: names[b.tool_use_id] || "tool", ...(b.tool_use_id && !b.tool_use_id.startsWith("call_") ? { id: b.tool_use_id } : {}), response: { result } } });
      }
    }
    if (parts.length) contents.push({ role, parts });
  }
  return contents;
}

module.exports = async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (req.method === "GET") return res.status(key ? 200 : 501).json({ ok: !!key, provider: "Gemini" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!key) return res.status(501).json({ error: "GEMINI_API_KEY is not set" });
  const { messages, tools } = req.body || {};
  if (!Array.isArray(messages) || !messages.length || JSON.stringify(req.body).length > 200000) return res.status(400).json({ error: "Bad request" });
  const body = { contents: toContents(messages), generationConfig: { maxOutputTokens: 2048 } };
  if (Array.isArray(tools) && tools.length) body.tools = [{ functionDeclarations: tools.slice(0, 8).map((t) => ({ name: t.name, description: t.description, parameters: cleanSchema(t.input_schema) })) }];
  try {
    const r = await fetch(`${BASE}/${MODEL}:generateContent`, { method: "POST", headers: { "x-goog-api-key": key, "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: (data.error && data.error.message) || "Gemini error" });
    const cand = (data.candidates || [])[0] || {}, parts = (cand.content && cand.content.parts) || [];
    const content = [];
    parts.forEach((p, i) => {
      if (p.text && !p.thought) content.push({ type: "text", text: p.text });
      if (p.functionCall) content.push({ type: "tool_use", id: p.functionCall.id || `call_${i}_${p.functionCall.name}`, callId: p.functionCall.id, name: p.functionCall.name, input: p.functionCall.args || {} });
    });
    const usedTool = content.some((b) => b.type === "tool_use");
    content.push({ type: "gemini_parts", parts }); // sent back untouched next round, keeping Gemini's thought signatures
    return res.status(200).json({ content, stop_reason: usedTool ? "tool_use" : cand.finishReason === "MAX_TOKENS" ? "max_tokens" : "end_turn" });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach Gemini" });
  }
};
