# Three-minute demonstration

Target: [https://xmumhkt.arcueidmp.com](https://xmumhkt.arcueidmp.com). This is a working three-minute script, not an official competition time limit. Use only the supplied synthetic profiles and PDF fixtures.

## Before the presentation

- Open Profile, select Reset demo, and confirm that no skills or CV text remain.
- Load Aina Sofea, the synthetic electrical and electronic engineering student. Confirm that the radar and matches open, then reset again for the live start.
- Keep Data & method and the public repository available in separate tabs. Check the actual last refresh status; describe what it says rather than claiming a scheduled run occurred when it did not.
- Prepare a local static build as fallback: `npm ci`, `npm run build:static`, then `npx wrangler dev --local --port 4175`. Open `http://localhost:4175` before presenting. Local assets include the PDF worker; PDF imports require no external parsing service.
- Keep `src/lib/__fixtures__/cv/synthetic-cv.pdf` ready if the judges request an upload demonstration. It is a separate invented CV, not Aina's profile. Reset and reload Aina before resuming the main story.

## 0:00–0:25 — A specific person and decision

**Action:** Open Profile and load Aina Sofea.

**Say:** “Meet Aina, a synthetic final-year electrical engineering student in Malaysia. She has a solar project, PCB experience and a test-floor internship. Her question is concrete: which roles should she prepare for as AI changes the work, and what should she learn next?”

**Show:** Recognised skills and the coursework, project and work levels. Hover a skill to reveal its source phrase. Mention that PDF and text imports run in the browser and levels can be corrected.

## 0:25–0:55 — Follow the evidence

**Action:** Open Skills Radar. Show the data-update panel, then select the earliest snapshot and return to Latest.

**Say:** “We connect her skills to dated AI-use and hiring signals. The radar changes when those signals change. These historical views replay earlier signals using today's catalogue and assumptions; they are not a backtest. Here we distinguish the source dates from when the pipeline last refreshed successfully.”

**Show:** One skill detail and its source links. Avoid reading every number or implying US hiring data is Malaysian vacancy data.

## 0:55–1:40 — Compare two plausible assumptions

**Action:** Open Matches, then Compare scenarios.

**Say:** “We hold Aina's profile, data snapshot and scoring weights fixed. These are the top options under Moderate and Fast AI adoption. The table shows which ranks and scores change, and which roles stay in the top five in both scenarios.”

**Show:** A role's score and outlook differences, then both suggested pathways.

**If the leading role stays the same:** “This recommendation is stable across these two assumptions. Its score can still change. Stability is useful information; we do not force a different answer.”

**If the leading role changes:** State the two titles actually displayed. Explain the difference using the visible outlook contribution, without claiming a guaranteed career outcome.

## 1:40–2:25 — Leave with a next step

**Action:** Select Use Fast plan. Show the target role, hours, weeks, first course and portfolio project.

**Say:** “Aina leaves with an ordered plan at her chosen study pace and budget. Every course is sourced. These are gaps the plan addresses, not skills she has already mastered. The portfolio project is based on a real occupational task.”

**Show:** A course source and one SDG rationale tied to a role task. If a gap has no verified course, point it out as a known coverage limit.

## 2:25–3:00 — Evidence, limits and value

**Action:** Open Data & method or the evaluation report in the repository.

**Say:** “This is a working, inspectable prototype with 12 synthetic evaluation cases. We check coverage, budget constraints, ranking sensitivity and name/graduation invariance. That is not employment forecasting validation. The largest limitations are labour-market transfer to Malaysia, incomplete course coverage and uncertain adoption rates. SkillTide helps a student compare options, understand the evidence and take the next step; the student makes the decision.”

## Recovery actions

- **Internet unavailable:** use the already-running local static build and its bundled dataset. State the saved snapshot date. External source/course links need connectivity; do not pretend to open them offline.
- **PDF has no selectable text or requires a password:** show the actionable message, then use the synthetic sample. OCR and password entry are outside this version.
- **Unexpected profile or scenario:** use Reset demo, reload Aina, select Latest and Moderate, then continue.
- **A refresh failed or is overdue:** use the last validated dataset and the recorded status. Demonstrate the workflow logs separately; do not run a large refresh during the three-minute presentation.
