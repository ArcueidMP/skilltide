# Three-minute demonstration

Target: [https://xmumhkt.arcueidmp.com](https://xmumhkt.arcueidmp.com). This is a working three-minute script, not an official competition time limit. Use only the supplied synthetic profiles and CV files.

The story follows Kavin a/l Raj, a synthetic final-year mechatronics student. Role titles below are what the 16 October 2026 data shows. The data refresh is paused while the competition is judged, so the screen should match; if it does not, say the titles on screen instead.

## Before the presentation

- Download the synthetic CV, [kavin-raj-synthetic-cv.pdf](../public/samples/kavin-raj-synthetic-cv.pdf), to the desktop. The Profile page links to the same file ("sample CV (PDF)").
- Open Profile, select Reset demo, and confirm that no skills or CV text remain. Keep the Guide panel open.
- Keep Data & method and the public repository available in separate tabs. Check the actual last refresh status on the Skills Radar data panel; describe what it says.
- Prepare a local static build as fallback: `npm ci`, `npm run build:static`, then `npx wrangler dev --local --port 4175`. Open `http://localhost:4175` before presenting. Local assets include the PDF worker and fonts; PDF imports need no external service.

## 0:00–0:30 — A specific person, from his own CV

**Action:** On Profile, choose Upload PDF or text and pick `kavin-raj-synthetic-cv.pdf`.

**Say:** “Meet Kavin, a synthetic final-year mechatronics student in Johor. We read his CV in the browser; nothing is uploaded. SkillTide finds twelve skills and grades them by where they appear: PLC, SCADA and maintenance from his internship, ROS, OpenCV and Python from projects, the rest from coursework.”

**Show:** Hover PLC programming to reveal the phrase it came from. Mention that a level can be corrected by hand.

## 0:30–0:55 — His goals change the answer

**Action:** Open Matches and note the top role (Mechatronics Engineer). Go to Profile → Quick questions, pick SDG 9 and SDG 12, and return to Matches.

**Say:** “Kavin cares about industry and innovation and about less waste. Those goals are part of the score, so Manufacturing Engineer now leads. Its links point to specific UN targets — 9.2, 9.4 and 12.5 — each backed by a real task from the role.”

**Show:** Why this score: the SDG fit component, and one SDG target with its task evidence.

## 0:55–1:35 — The data moves, and so does the advice

**Action:** Open Skills Radar. Show the data-update panel, then select Mar 2025 on the timeline and return to Latest. Watch the Guide.

**Say:** “Every signal is dated. In March 2025 the same profile would have been pointed to Electro-Mechanical & Mechatronics Technician; with today's hiring and AI-use data it is Manufacturing Engineer. The Guide re-plans automatically and says what replaced what. These replays use today's catalogue and assumptions, so they are not a backtest. A GitHub Actions job refreshes the data and publishes it only if the checks pass; its weekly schedule is paused while the competition is judged, and this panel shows the last validated run.”

**Show:** The two re-plan messages in the Guide and the data-update panel. Avoid implying that US hiring data is Malaysian vacancy data.

## 1:35–2:10 — Two futures, one starting point

**Action:** Open Matches, then Compare scenarios.

**Say:** “We hold Kavin's profile, data and weights fixed and change only the AI adoption assumption. Manufacturing Engineer leads in both, but its outlook drops under fast adoption. A stable answer is useful information; we do not force a dramatic change.”

**Show:** The outlook change column and both suggested pathways. If the leading role differs, state the two titles displayed and explain them with the visible outlook contribution.

## 2:10–2:40 — Leave with a next step

**Action:** Choose Use Fast plan, or Plan pathway on the top role. Show hours, weeks, the first course and the portfolio project.

**Say:** “Kavin leaves with an ordered plan at his study pace and budget. Every course's hours and cost link to where we read them. The plan addresses gaps; it does not certify mastery. It ends with a portfolio project built on a real task from the role.”

**Show:** A course source link. If a gap has no verified course, point it out as a known coverage limit.

## 2:40–3:00 — Evidence, limits and value

**Action:** Open Data & method or the evaluation report in the repository.

**Say:** “This is a working, inspectable prototype with 12 synthetic evaluation cases. We check coverage, budget constraints, ranking sensitivity and name and graduation-year invariance. That is not validation against employment outcomes. The largest limitations are labour-market transfer to Malaysia, incomplete course coverage and uncertain adoption rates. SkillTide helps a student compare options, see the evidence and take the next step; the student makes the decision.”

## Recovery actions

- **Internet unavailable:** use the already-running local static build and its bundled dataset. State the saved snapshot date. External source and course links need connectivity; do not pretend to open them offline.
- **PDF import fails:** show the message, then load Kavin a/l Raj from the sample students; his skills and levels are the same as the PDF's. OCR and password entry are outside this version.
- **Unexpected profile or scenario:** use Reset demo, upload the PDF again (or load Kavin), select Latest and Moderate, then continue.
- **A refresh failed or is overdue:** use the last validated dataset and the recorded status. Show the workflow logs separately; do not run a refresh during the three-minute presentation.
