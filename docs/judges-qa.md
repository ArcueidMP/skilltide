# Judge Q&A

## 1. Where is the AI in this product?

SkillTide models the impact of AI using published task-exposure and observed-use datasets. Recommendations come from deterministic rules and scenario formulas. The only runtime language model is optional and off by default: with *AI wording* turned on, OpenAI's `gpt-6-luna` rephrases the Guide's answer from facts SkillTide computed, and the server shows the reply only if every number in it appears in those facts; otherwise the rule-based answer is shown. AI coding tools assisted development. We disclose these distinctions and do not describe the guide as an LLM chatbot.

## 2. How does this differ from asking a chatbot for jobs?

The catalogue is source-backed, the same inputs produce the same scores, and each recommendation exposes skill gaps and score contributions. Users can replay dated signals, change weights and compare assumptions. Jobs, courses and statistics are not invented at runtime.

## 3. Does it really keep updating?

The refresh pipeline can re-download changing hiring inputs and the live course catalogue, validate them and publish an updated dataset. Its weekly schedule (Monday 10:00 SGT) is paused during judging so the submitted data stays fixed; the last successful run was on 21 Oct 2026 and can be checked in the repository's Actions view. Fixed Anthropic releases and curated mappings require explicit version updates; we do not claim automatic discovery of every new AI release.

## 4. How accurate are the predictions?

They are conditional estimates, not probabilities or validated job forecasts. We have a 12-case synthetic evaluation and report a skills-only comparator. Neither replaces independent review or observed career outcomes. The evaluation report lists its denominators and limitations and records mismatches without tuning the coefficients to the cases.

## 5. Why should a Malaysian student trust mostly international data?

They should treat it as a starting point and inspect the evidence. O*NET describes US occupations, Indeed covers the US, UK and Australia, and Hacker News favours technology start-ups. Malaysia's Critical Occupations List supplies local shortage context, but the product makes no claim to represent Malaysian vacancies comprehensively. Better local evidence is a priority for future validation.

## 6. What does the fairness check establish?

It checks that changing names and graduation years leaves the ranking unchanged. The scoring formula does not use those fields. This is a narrow invariance check, not proof of fairness across all demographic groups, career backgrounds, disabilities or incomplete inputs.

## 7. What happens to a CV?

PDF and text extraction run in the browser. The file and full CV text are not saved or sent to a parsing service. Skills and short supporting phrases remain in browser storage until Reset demo clears them. To rank roles, SkillTide's API receives only skill ids and levels, chosen goals, weekly hours, budget and the ids of pathway steps marked done, and stores none of it. Pathway progress and badges stay in browser storage too. Demonstrations use synthetic profiles only. Scanned PDFs need OCR first, and protected PDFs need an unlocked copy.

## 8. How are SDGs meaningful here?

Roles and skills link to specific UN targets. Role mappings expose their rationale and, where available, the occupational task supporting the link. A user's selected goals contribute to the matching score, making the preference inspectable rather than a decorative badge.

## 9. Does a recommended course mean the student has closed a gap?

No. A plan addresses priority gaps; the student still needs to learn, practise and demonstrate capability. Course durations and cost categories have sources, and unserved gaps remain visible. The portfolio task is a suggested application exercise, not an accredited assessment or automatically generated full course.

## 10. What is the hardest remaining risk?

The largest risk is whether source coverage and the model assumptions support useful decisions for the intended Malaysian students. Next steps are independent reviews of fixed synthetic cases, carefully selected local evidence, and observed usability sessions. No user-study or expert-review results are claimed before those activities occur.

# Requirement-to-evidence matrix

| Brief requirement | Working demonstration | Evidence |
|---|---|---|
| Skills profile intake | Profile: PDF/text import, form, synthetic samples | Local extraction with phrase evidence; invalid-file handling |
| Updatable AI/job-market signals | Radar timeline; Data updates | Python pipeline; source/date table; refresh workflow and actual run logs |
| Explainable future-role matching | Matches and score breakdown | Skill, outlook and SDG components; visible gaps and weights |
| Personalised reskilling pathway | Pathway at selected pace and budget | Course links, durations, costs, sequence and portfolio task |
| SDG mapping | Role details and pathway impact | Target wording, rationale and source task |
| Handling uncertainty | Compare scenarios | Same inputs, two assumptions; ranks, scores and pathways shown together |
| Human-centred boundaries | Guide and Data & method | Runtime AI disclosure, estimates, synthetic data and privacy controls |

# Preliminary rubric preparation

| Criterion | Weight in supplied brief | What to emphasise |
|---|---:|---|
| Innovation & Creativity | 30% | A specific final-year decision; task-level evidence and explicit scenario comparison |
| Problem–Solution Fit | 25% | The complete intake → signals → roles → pathway → SDG journey |
| Feasibility of Build | 25% | Working public site and API, accessible source, validated refresh and an in-browser fallback |
| Clarity of Proposal | 20% | One student's decision, an understandable method and an actionable result |

The final-round rubric may differ. The supplied brief does not provide submission length or presentation-time limits; confirm those separately before submitting these working materials.
