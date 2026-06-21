# Backend note: spam / low-signal guard before report generation

**Owner:** backend (triage/report service — separate repo)
**Frontend impact:** none required (see "Response contract" — reuses an existing `type`)
**Status:** requested 2026-06-20

## Problem

The interview can reach "report" even when the user never gave a real chief
complaint and actively gave non-medical / joke / refusal answers. The backend
still treated the session as complete and emitted a **Health Summary** report.

### Real session that triggered this (verbatim)

```
A: What brings you in today or what symptoms are you experiencing?
U: man nhi lag raha bas horror movie dekhne ka Mman kar raha hai
A: Kya aapko dil ki dhadkan tez mehsoos ho rahi hai, saans lene mein takleef, ya paseena aata hai?
U: naaa tere se baat karke tension ho raha hai
A: Does anything make it better or worse — like food, movement, or rest?
U: no
A: Have you ever experienced similar episodes ... or taken any medicines for them?
U: no medicines taken, hindi me bol
A: Do you have any allergies to medicines or anything else?
U: nahi bhai
U: bhai horror movie dekhne ka man kar raha hai
=> Health Summary generated (WRONG)
```

No symptom was ever stated. Every answer was a denial, a deflection, or a joke
("talking to you is stressing me out", "I just feel like watching a horror
movie"). A medical report must not be produced from this.

## Required behaviour

A report may be generated **only** when both hold:

1. A real **chief complaint** (≥1 concrete symptom / health concern) was
   captured. Age/sex alone is not a complaint.
2. There is at least a minimum of **informative** answers. Bare denials
   ("no", "nahi bhai") to every question are not information.

If, instead, the session is low-signal — i.e. any of:

- N consecutive **non-informative** user turns (suggest N = 3), where
  non-informative = off-topic, refusal/deflection, gibberish/keyboard-mash, or
  pure denial with no chief complaint on record; or
- the interview "completes" but **no chief complaint** was ever established —

then do **not** generate a report. Return a nudge (below), do **not** advance
`progress` / `stepsLeft` toward the report, and keep the session open so a real
complaint can still rescue it.

Detection should be the LLM/classifier's job (robust to Hinglish, code-switching,
sarcasm) — not a keyword blocklist. The frontend already does the obvious-junk
heuristic separately if enabled; this note covers the authoritative backend gate.

## Response contract (no frontend change needed)

Reuse the existing `MessageResponse` shape. Return `type: "out_of_scope"` (the
frontend's `handleResponse` renders `out_of_scope` / `refusal` / default as a
plain assistant bubble — **no report, no progress bump**):

```jsonc
{
  "intent": "low_signal",          // or "spam" — informational only
  "type": "out_of_scope",          // MUST NOT be "report"
  "message": "<bilingual nudge, mirrors the user's language>",
  // no "report", and do NOT bump progress / stepsLeft
}
```

If you prefer an explicit discriminator, add a new `type: "low_signal"` to the
backend and tell us — frontend already falls through `default → say(res.message)`,
so it will render correctly, but we'd then add it to the
`MessageResponse.type` union in `src/app/ai-doctor/models/index.ts` for clarity.

### Suggested nudge copy (mirror user language, like the rest of the app)

> I want to help, but I need an actual health concern to go on. Tell me what's
> physically bothering you — a symptom, pain, or worry — and I'll take it from
> there. If nothing's wrong right now, that's completely fine; come back when
> something is.

Hindi/Hinglish variant (since this session was Hinglish):

> Main madad karna chahta hoon, par iske liye ek asli health problem chahiye.
> Bataiye aapko sharirik roop se kya takleef ho rahi hai — koi symptom, dard,
> ya chinta — phir aage badhte hain. Abhi kuch nahi ho raha to koi baat nahi.

## Anti-abuse follow-ups (optional, backend)

- Rate-limit report generation per session/lead to stop deliberate spamming.
- Count low-signal sessions per lead for ops visibility.
```
