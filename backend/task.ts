export const task = `You are doing a 5-minute product sanity check.

Goal:
Does this product deliver its SINGLE core promise?

Do NOT explore beyond what is required.
Do NOT scroll more than ONCE.

────────────────────────────
STEP 1 — CLAIM
────────────────────────────

1. Visit https://memora.sbs

In ONE sentence, answer:
- What does this product claim to do?

Is pricing visible? (Yes / No)

────────────────────────────
STEP 2 — CORE ACTION
────────────────────────────

2. Log in:
- Email: ll@gmail.com
- Password: abhay123

3. Create ONE note with this exact text:
"Memora core value test note."

4. Open AI chat and ask:
"What note did I just create?"

────────────────────────────
STEP 3 — VERDICT
────────────────────────────

5. Answer ONLY:
- Did AI correctly retrieve the note? (Yes / No)
- Response time (seconds)
- Verdict:
  🟢 Works
  🔴 Broken

────────────────────────────
OUTPUT FORMAT
────────────────────────────

# MEMORA CORE TEST RESULT

Claim:
[One sentence]

Pricing visible:
Yes / No

AI Retrieval:
Success / Failed

Latency:
~X seconds

Final Verdict:
🟢 WORKS / 🔴 BROKEN

IMPORTANT:
- No extra analysis
- No recommendations
- No competitor comparison
- Stop immediately after verdict
`;
