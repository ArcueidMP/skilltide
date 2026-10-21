# SkillTide: a career navigator for the AI era

Working proposal for the XMUM Hackathon, Aiversecity Future-Ready Workforce domain. This draft is approximately 1,000 words; the supplied domain brief does not specify the official submission length. All demonstration profiles are synthetic.

## Problem and intended user

A final-year student can describe what they have studied but still struggle to decide which role to pursue as AI changes the tasks within that role. A list of fashionable skills gives little help with that decision. Students need to connect their own evidence of experience to changing work, understand the gaps, and find an affordable next step.

SkillTide focuses on final-year computing, electrical and electronic engineering, and mechatronics students in Malaysia. The moment of need is the transition from university to the first job. The intended outcome is a short list of explainable career options and an ordered learning plan. A secondary, synthetic cohort view lets university career centres explore common skill gaps.

## Approach

SkillTide brings dated AI-use and hiring signals into an inspectable scenario model. A student imports a synthetic CV, reviews the recognised skills, explores a Future Skills Radar, compares future roles, and chooses a reskilling pathway. They remain responsible for the decision. SkillTide neither screens applicants nor makes hiring decisions.

The first step accepts selectable-text PDF, TXT and Markdown files, pasted text, a skills form, or sample students. Extraction runs in the browser. Rules identify skill aliases and retain the matching phrases as evidence. Section headings distinguish coursework, project and internship experience. Users can correct the resulting levels. The original file and full text are not persisted; the profile and short skill-evidence snippets remain in local browser storage and can be cleared with Reset demo.

## Dated signals, rather than a fixed job list

The current catalogue contains 30 roles, 57 skills and 72 courses. Roles and tasks are grounded in [O*NET](https://www.onetcenter.org/database.html). The model combines theoretical task exposure from [GPTs are GPTs](https://github.com/openai/GPTs-are-GPTs) with observed AI use and automation-versus-assistance patterns from the [Anthropic Economic Index](https://huggingface.co/datasets/Anthropic/EconomicIndex). [Indeed Hiring Lab](https://github.com/hiring-lab/job_postings_tracker) contributes sector hiring demand; its [AI tracker](https://github.com/hiring-lab/ai-tracker) and Hacker News hiring threads contribute skill-related signals.

A Python pipeline produces the dataset consumed by the application. The weekly workflow refreshes changing hiring inputs and the live course catalogue, validates the result, and preserves the last published dataset if an update fails. Fixed AI releases and curated mappings remain explicitly versioned: automatic discovery of every new AI dataset is not claimed. The interface distinguishes publication dates, actual input-download records, dataset-build time and the last validated refresh. Reusing a cached file does not manufacture a new download date.

Six snapshots let users replay historical signals. These views use the current catalogue and scenario assumptions; they are not strict historical forecasting backtests. Every recommendation can be traced to named sources, dates, skill requirements and model contributions.

## Explainable matching and uncertainty

The matching score combines existing skill fit, the role's AI outlook, and the user's optional SDG preferences. Users can change these weights and inspect the resulting ranking. A skills-gap breakdown makes the difference between current and expected capability visible. The score is a decision-support index, not a probability of getting a job.

Moderate and Fast AI adoption represent different assumptions about how quickly tasks may be assisted or automated. A comparison panel holds the profile, evidence snapshot and scoring weights fixed while displaying both rankings. It shows the union of the top five roles, score and outlook changes, and the leading pathway in each scenario. Roles appearing in both lists are labelled “Top 5 in both scenarios”; this is an observable ranking property, not a claim that a career is future-proof.

The comparison also explains stability. The same role can remain first, and the same courses can remain appropriate. Changing an adoption assumption does not change what a student already knows or a role's catalogued requirements. SkillTide exposes these unchanged outcomes rather than forcing a dramatic recommendation change for the demonstration.

## An actionable learning pathway and meaningful SDGs

The pathway prioritises technical gaps and selects available courses according to coverage, study effort and the user's budget. It orders courses from introductory to advanced, estimates weeks from the chosen study hours, and ends with a suggested portfolio task grounded in the target role. Course links, durations and cost categories have recorded sources. Gaps without a verified course remain visible.

Learning plans address gaps; they do not certify mastery. The suggested portfolio task offers a way to demonstrate application, and a human adviser can help assess the result. The product does not generate course content or integrate with real recruitment or payment systems.

Each tracked role and skill links to at least one UN SDG target. Role links include a rationale and, where available, the occupational task that supports it. A student can prefer goals such as clean energy or industry and innovation, then inspect how those preferences affect the matching score. This makes SDGs part of the choice and its explanation, rather than decorative badges.

## Feasibility, evidence and limits

The prototype is a static Next.js application deployed to Cloudflare at [xmumhkt.arcueidmp.com](https://xmumhkt.arcueidmp.com). Career calculations run locally; the interface does not require a runtime language model. AI coding assistance was used during development. The product's runtime consists of explicit rules, formulas and published datasets, a distinction disclosed in the application and repository.

The reproducible evaluation covers 12 synthetic cases, including four demonstration students and boundary cases for sparse skills, budget and study time. Its report separates family-level relevance expectations, budget checks, pathway coverage and sensitivity. These author-defined cases are not independent expert validation or evidence of employment outcomes. The skills-only comparator is reported alongside the combined model; matching it on a coarse measure does not establish superiority.

The main risks are signal quality and relevance to Malaysia. O*NET and much hiring evidence describe other labour markets; Claude usage is not representative of all AI use; dataset releases can change their measurement methods. Malaysian shortage-list context helps localise the discussion but does not remove these limits. Scenario adoption rates remain assumptions, and the catalogue is incomplete.

The demonstration will show a complete, source-backed journey and how its recommendations respond to a different snapshot or scenario. The next validation step is independent review of the same synthetic cases by career advisers and students. No such reviews or user-study outcomes are claimed at this stage.
