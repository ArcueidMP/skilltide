#!/usr/bin/env python3
"""Build SkillTide's dataset from public sources.

Run from the repository root:

    python -I pipeline/build_dataset.py            # download what is missing, then build
    python -I pipeline/build_dataset.py --refresh  # re-download sources that update often

Downloads are cached in .cache/pipeline/ (git-ignored). The output, src/data/dataset.json,
is the only file the web app reads. Every value in it traces back to a source listed in
its "sources" block; curated mappings live in pipeline/curated/.

Standard library only, so it runs unchanged in GitHub Actions.
"""

from __future__ import annotations

import csv
import datetime as dt
import html
import json
import math
import re
import shutil
import statistics
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CURATED = ROOT / "pipeline" / "curated"
CACHE = ROOT / ".cache" / "pipeline"
OUT = ROOT / "src" / "data" / "dataset.json"
UA = "SkillTide-pipeline/0.1 (student hackathon prototype; github.com/ArcueidMP/skilltide)"
TODAY = dt.date.today()
REFRESH = "--refresh" in sys.argv

csv.field_size_limit(10**9)


# ---------------------------------------------------------------------------
# Helpers


def log(message: str) -> None:
    print(f"[pipeline] {message}", flush=True)


def fetch(url: str, dest: Path, *, refresh: bool = False) -> Path:
    """Download url to dest unless a non-empty cached copy exists."""
    if dest.exists() and dest.stat().st_size > 0 and not refresh:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=600) as response, open(tmp, "wb") as out:
                shutil.copyfileobj(response, out)
            tmp.replace(dest)
            return dest
        except Exception as error:  # noqa: BLE001 - network errors vary by platform
            if attempt == 2:
                raise RuntimeError(f"download failed: {url}: {error}") from error
            time.sleep(2 * (attempt + 1))
    return dest


def fetch_json(url: str, dest: Path, *, refresh: bool = False):
    fetch(url, dest, refresh=refresh)
    return json.loads(dest.read_text(encoding="utf-8"))


def read_csv(path: Path, delimiter: str = ","):
    with open(path, encoding="utf-8", newline="") as handle:
        yield from csv.DictReader(handle, delimiter=delimiter)


def norm_task(text: str) -> str:
    """Normalise a task statement so different releases can be joined on text."""
    return re.sub(r"\s+", " ", text.strip().lower()).rstrip(".").strip()


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def percentile(values: list[float], q: float) -> float:
    ordered = sorted(values)
    if not ordered:
        return 0.0
    index = (len(ordered) - 1) * q
    low, high = math.floor(index), math.ceil(index)
    return ordered[low] + (ordered[high] - ordered[low]) * (index - low)


def load_curated(name: str):
    return json.loads((CURATED / name).read_text(encoding="utf-8"))


SOURCES: dict[str, dict] = {}


def source(id_: str, **info) -> str:
    info.setdefault("retrieved", TODAY.isoformat())
    SOURCES[id_] = {"id": id_, **info}
    return id_


# ---------------------------------------------------------------------------
# 1. O*NET 31.0: occupations, tasks, ratings, technologies

ONET_VERSION = "31.0"
ONET_DIR = CACHE / f"onet-{ONET_VERSION}"
ONET_FILES = [
    "occupation_data",
    "task_statements",
    "task_ratings",
    "software_skills",
    "emerging_tasks",
    "sample_of_reported_titles",
    "knowledge",
    "transferable_skills",
    "essential_skills",
    "job_zones",
]


def load_onet():
    for name in ONET_FILES:
        fetch(
            f"https://www.onetcenter.org/dl_files/database/db_{ONET_VERSION.replace('.', '_')}_csv/{name}.csv",
            ONET_DIR / f"{name}.csv",
        )
    source(
        "onet",
        name=f"O*NET {ONET_VERSION} Database",
        publisher="U.S. Department of Labor, Employment and Training Administration",
        url="https://www.onetcenter.org/database.html",
        licence="CC BY 4.0",
        published="2026-08",
        note=(
            f"This page includes information from the O*NET {ONET_VERSION} Database by the U.S. Department of Labor, "
            "Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. O*NET® is a "
            "trademark of USDOL/ETA. SkillTide has modified all or some of this information. USDOL/ETA has not "
            "approved, endorsed, or tested these modifications."
        ),
    )

    occupations = {row["O*NET-SOC Code"]: row for row in read_csv(ONET_DIR / "occupation_data.csv")}

    tasks: dict[str, list[dict]] = defaultdict(list)
    all_task_text: dict[str, set[str]] = defaultdict(set)
    for row in read_csv(ONET_DIR / "task_statements.csv"):
        tasks[row["O*NET-SOC Code"]].append(
            {"id": row["Task ID"], "statement": row["Task"].strip(), "type": row["Task Type"]}
        )
        all_task_text[norm_task(row["Task"])].add(row["Task ID"])

    importance: dict[tuple[str, str], float] = {}
    for row in read_csv(ONET_DIR / "task_ratings.csv"):
        if row["Scale ID"] == "IM":
            importance[(row["O*NET-SOC Code"], row["Task ID"])] = float(row["Data Value"])

    software: dict[str, dict[str, tuple[bool, bool]]] = defaultdict(dict)
    for row in read_csv(ONET_DIR / "software_skills.csv"):
        software[row["O*NET-SOC Code"]][row["Workplace Example"]] = (
            row["Hot Technology"] == "Y",
            row["In Demand"] == "Y",
        )

    elements: dict[tuple[str, str, str], dict[str, float]] = defaultdict(dict)
    for name in ("knowledge", "transferable_skills", "essential_skills"):
        for row in read_csv(ONET_DIR / f"{name}.csv"):
            if row.get("Recommend Suppress") == "Y" or row.get("Not Relevant") == "Y":
                continue
            elements[(name, row["O*NET-SOC Code"], row["Element ID"])][row["Scale ID"]] = float(row["Data Value"])

    job_zones = {row["O*NET-SOC Code"]: int(row["Job Zone"]) for row in read_csv(ONET_DIR / "job_zones.csv")}

    titles: dict[str, list[str]] = defaultdict(list)
    for row in read_csv(ONET_DIR / "sample_of_reported_titles.csv"):
        titles[row["O*NET-SOC Code"]].append(row["Reported Job Title"])

    new_tasks: dict[str, list[dict]] = defaultdict(list)
    for row in read_csv(ONET_DIR / "emerging_tasks.csv"):
        if row["Category"] == "New":
            new_tasks[row["O*NET-SOC Code"]].append({"statement": row["Task"].strip(), "date": row["Date"]})

    return {
        "occupations": occupations,
        "tasks": tasks,
        "task_text": all_task_text,
        "importance": importance,
        "software": software,
        "elements": elements,
        "job_zones": job_zones,
        "titles": titles,
        "new_tasks": new_tasks,
    }


# ---------------------------------------------------------------------------
# 2. Theoretical exposure ceiling: Eloundou et al. (GPT-4-rated beta per O*NET task)

ELOUNDOU_DIR = CACHE / "eloundou"


def load_eloundou():
    path = fetch(
        "https://raw.githubusercontent.com/openai/GPTs-are-GPTs/main/data/full_labelset.tsv",
        ELOUNDOU_DIR / "full_labelset.tsv",
    )
    source(
        "eloundou",
        name="GPTs are GPTs task exposure labels (β)",
        publisher="Eloundou, Manning, Mishkin & Rock — OpenAI / OpenResearch / UPenn",
        url="https://github.com/openai/GPTs-are-GPTs",
        licence="MIT",
        published="2024",
        note="β = 1 if an LLM alone could halve a task's time, 0.5 if it needs extra software, 0 otherwise (GPT-4 ratings).",
    )
    by_id: dict[str, float] = {}
    by_text: dict[str, float] = {}
    for row in read_csv(path, delimiter="\t"):
        try:
            beta = float(row["beta"])
        except (KeyError, ValueError):
            continue
        task_id = row["Task ID"].split(".")[0]
        by_id[task_id] = beta
        by_text[norm_task(row["Task"])] = beta
    return by_id, by_text


# ---------------------------------------------------------------------------
# 3. Observed AI use: Anthropic Economic Index (task usage share + collaboration mode)

AEI_DIR = CACHE / "aei"
AEI_BASE = "https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/"
AUTOMATION_PATTERNS = {"directive", "feedback loop", "feedback_loop"}
AUGMENTATION_PATTERNS = {"task iteration", "task_iteration", "learning", "validation"}

# Each AEI release becomes one dated snapshot. Older releases are joined on task text;
# the 2026-06 release carries O*NET task ids.
AEI_RELEASES = [
    {
        "id": "2025-03",
        "release": "2025-03-27",
        "period": "Feb–Mar 2025",
        "format": "v2",
        "files": ["release_2025_03_27/task_pct_v2.csv", "release_2025_03_27/automation_vs_augmentation_by_task.csv"],
        "report": "https://www.anthropic.com/news/anthropic-economic-index-insights-from-claude-sonnet-3-7",
    },
    {
        "id": "2025-09",
        "release": "2025-09-15",
        "period": "4–11 Aug 2025",
        "format": "long",
        "files": ["release_2025_09_15/data/output/aei_enriched_claude_ai_2025-08-04_to_2025-08-11.csv"],
        "report": "https://www.anthropic.com/research/anthropic-economic-index-september-2025-report",
    },
    {
        "id": "2026-01",
        "release": "2026-01-15",
        "period": "13–20 Nov 2025",
        "format": "long",
        "files": ["release_2026_01_15/data/intermediate/aei_raw_claude_ai_2025-11-13_to_2025-11-20.csv"],
        "report": "https://www.anthropic.com/research/anthropic-economic-index-january-2026-report",
    },
    {
        "id": "2026-03",
        "release": "2026-03-24",
        "period": "5–12 Feb 2026",
        "format": "long",
        "files": ["release_2026_03_24/data/aei_raw_claude_ai_2026-02-05_to_2026-02-12.csv"],
        "report": "https://www.anthropic.com/research/economic-index-march-2026-report",
    },
    {
        "id": "2026-06",
        "release": "2026-06-26",
        "period": "May 2026",
        "format": "monthly",
        "files": ["release_2026_06_26/data/aei_claude_ai_2026-06-26.csv"],
        "report": "https://www.anthropic.com/research/economic-index-june-2026-report",
    },
]


def aei_path(rel: str) -> Path:
    return fetch(AEI_BASE + rel, AEI_DIR / rel.replace("/", "_"))


def automation_share(patterns: dict[str, float]) -> float | None:
    auto = sum(v for k, v in patterns.items() if k in AUTOMATION_PATTERNS)
    aug = sum(v for k, v in patterns.items() if k in AUGMENTATION_PATTERNS)
    return auto / (auto + aug) if auto + aug > 0 else None


def load_aei_release(release: dict) -> dict:
    """Returns task usage (by normalised text or task id), automation shares and Malaysia data."""
    usage: dict[str, float] = {}
    usage_my: dict[str, float] = {}
    patterns: dict[str, dict[str, float]] = defaultdict(dict)
    automation: dict[str, float] = {}
    my_index = None
    keyed_by = "text"

    if release["format"] == "v2":
        pct_path, auto_path = (aei_path(f) for f in release["files"])
        for row in read_csv(pct_path):
            usage[norm_task(row["task_name"])] = float(row["pct"])
        for row in read_csv(auto_path):
            share = automation_share({
                "directive": float(row["directive"]),
                "feedback loop": float(row["feedback_loop"]),
                "task iteration": float(row["task_iteration"]),
                "learning": float(row["learning"]),
                "validation": float(row["validation"]),
            })
            if share is not None:
                automation[norm_task(row["task_name"])] = share

    elif release["format"] == "long":
        path = aei_path(release["files"][0])
        for row in read_csv(path):
            geo, facet, variable = row["geo_id"], row["facet"], row["variable"]
            if geo in ("MY", "MYS") and facet == "country" and variable == "usage_per_capita_index":
                my_index = float(row["value"])
            if facet == "onet_task" and variable == "onet_task_pct":
                if geo == "GLOBAL":
                    usage[norm_task(row["cluster_name"])] = float(row["value"])
                elif geo in ("MY", "MYS"):
                    usage_my[norm_task(row["cluster_name"])] = float(row["value"])
            elif facet == "onet_task::collaboration" and variable == "onet_task_collaboration_pct" and geo == "GLOBAL":
                task, _, pattern = row["cluster_name"].rpartition("::")
                patterns[norm_task(task)][pattern] = float(row["value"])
        for task, mix in patterns.items():
            share = automation_share(mix)
            if share is not None:
                automation[task] = share

    elif release["format"] == "monthly":
        keyed_by = "id"
        path = aei_path(release["files"][0])
        # One pass, grouped by month; only the latest month is used.
        by_month: dict[str, dict] = defaultdict(
            lambda: {"usage": {}, "usage_my": {}, "buckets": defaultdict(dict), "my_index": None}
        )
        for row in read_csv(path):
            geo, metric, category = row["geo_id"], row["metric_id"], row["category_name"]
            month = by_month[row["date_start"]]
            if geo == "MYS" and category == "overall" and metric == "usage_per_capita_index":
                month["my_index"] = float(row["value"])
            if category != "onet" or row["hierarchy_level"] != "0":
                continue
            # Index each value under the task id and the task text, so revised O*NET ids still join.
            keys = (row["node_external_id"].split(".")[0], norm_task(row["node_name"]))
            for key in keys:
                if metric == "pct":
                    if geo == "GLOBAL":
                        month["usage"][key] = float(row["value"])
                    elif geo == "MYS":
                        month["usage_my"][key] = float(row["value"])
                elif geo == "GLOBAL" and metric in ("collaboration_bucket_automation_pct", "collaboration_bucket_augmentation_pct"):
                    month["buckets"][key][metric] = float(row["value"])
        latest = max(m for m, data in by_month.items() if data["usage"])
        chosen = by_month[latest]
        usage, usage_my, my_index, buckets = chosen["usage"], chosen["usage_my"], chosen["my_index"], chosen["buckets"]
        for key, mix in buckets.items():
            auto = mix.get("collaboration_bucket_automation_pct", 0.0)
            aug = mix.get("collaboration_bucket_augmentation_pct", 0.0)
            if auto + aug > 0:
                automation[key] = auto / (auto + aug)
        release = {**release, "period": dt.date.fromisoformat(latest).strftime("%b %Y")}

    return {**release, "usage": usage, "usage_my": usage_my, "automation": automation, "my_index": my_index, "keyed_by": keyed_by}


def register_aei_sources() -> None:
    source(
        "aei",
        name="Anthropic Economic Index",
        publisher="Anthropic",
        url="https://huggingface.co/datasets/Anthropic/EconomicIndex",
        licence="CC BY (data)",
        published=AEI_RELEASES[-1]["release"],
        note="Share of Claude.ai conversations by O*NET task, and how people collaborate with Claude on each task.",
    )
    source(
        "aei-method",
        name="Anthropic — Labor market impacts (observed exposure method)",
        publisher="Anthropic (Massenkoff & McCrory)",
        url="https://www.anthropic.com/research/labor-market-impacts",
        licence="Cited",
        published="2026-03-05",
        note="SkillTide follows its idea of combining theoretical exposure (β) with observed use.",
    )
    source(
        "aei-robots",
        name="Anthropic — What work can robots do? (robot exposure index)",
        publisher="Anthropic",
        url="https://www.anthropic.com/research/what-work-can-robots-do",
        licence="CC BY (data)",
        published="2026-09-30",
    )


def load_robot_exposure() -> dict[str, float]:
    path = aei_path("robot_exposure/robot_exposure_occupations.csv")
    return {row["onetsoc_code"]: float(row["robot_exposure_index"]) for row in read_csv(path)}


# ---------------------------------------------------------------------------
# 4. Labour demand: Indeed Hiring Lab job postings by sector (US, GB, AU)

INDEED_DIR = CACHE / "indeed"
INDEED_COUNTRIES = ["US", "GB", "AU"]


MARKET = "__all_postings__"
AI_SHARE = "__ai_share__"
AI_SKILLS = {"machine-learning", "deep-learning", "genai", "computer-vision"}


def load_indeed() -> dict[str, dict[str, list[tuple[dt.date, float]]]]:
    """Sector postings, the all-postings index (key MARKET) and the AI share of postings (key AI_SHARE)."""
    series: dict[str, dict[str, list[tuple[dt.date, float]]]] = defaultdict(lambda: defaultdict(list))
    for country in INDEED_COUNTRIES:
        path = fetch(
            f"https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master/{country}/aggregate_job_postings_{country}.csv",
            INDEED_DIR / f"aggregate_job_postings_{country}.csv",
            refresh=REFRESH,
        )
        for row in read_csv(path):
            if row["variable"] == "total postings":
                series[MARKET][country].append((dt.date.fromisoformat(row["date"]), float(row["indeed_job_postings_index_SA"])))
    ai_path = fetch(
        "https://raw.githubusercontent.com/hiring-lab/ai-tracker/main/AI_posting.csv",
        INDEED_DIR / "AI_posting.csv",
        refresh=REFRESH,
    )
    for row in read_csv(ai_path):
        if row["jobcountry"] in INDEED_COUNTRIES:
            series[AI_SHARE][row["jobcountry"]].append((dt.date.fromisoformat(row["date"]), float(row["AI_share_postings"])))
    source(
        "indeed-ai",
        name="Indeed Hiring Lab — AI Tracker (share of postings mentioning AI)",
        publisher="Indeed Hiring Lab",
        url="https://github.com/hiring-lab/ai-tracker",
        licence="CC BY 4.0",
        published=max(d for pts in series[AI_SHARE].values() for d, _ in pts).isoformat(),
        note="Share of job postings that mention AI keywords such as machine learning or generative AI.",
    )
    for country in INDEED_COUNTRIES:
        path = fetch(
            f"https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master/{country}/job_postings_by_sector_{country}.csv",
            INDEED_DIR / f"job_postings_by_sector_{country}.csv",
            refresh=REFRESH,
        )
        for row in read_csv(path):
            if row["variable"] != "total postings":
                continue
            series[row["display_name"]][country].append(
                (dt.date.fromisoformat(row["date"]), float(row["indeed_job_postings_index"]))
            )
    latest = max(day for name, sector in series.items() if name not in (MARKET, AI_SHARE) for points in sector.values() for day, _ in points)
    source(
        "indeed",
        name="Indeed Hiring Lab — Job Postings Index by sector",
        publisher="Indeed Hiring Lab",
        url="https://github.com/hiring-lab/job_postings_tracker",
        licence="CC BY 4.0",
        published=latest.isoformat(),
        note="Seasonally adjusted postings (Feb 2020 = 100) for the US, UK and Australia; refreshed weekly.",
    )
    return series


def mean_around(points: list[tuple[dt.date, float]], end: dt.date, days: int = 28) -> float | None:
    window = [v for day, v in points if end - dt.timedelta(days=days) < day <= end]
    return sum(window) / len(window) if window else None


def sector_yoy(series, sector: str, as_of: dt.date) -> float | None:
    """Average year-on-year change in postings across countries, as a fraction."""
    changes = []
    for points in series.get(sector, {}).values():
        now = mean_around(points, as_of)
        then = mean_around(points, as_of - dt.timedelta(days=365))
        if now and then:
            changes.append(now / then - 1)
    return sum(changes) / len(changes) if changes else None


def ai_share_at(series, as_of: dt.date) -> tuple[float | None, float | None]:
    """Average AI share of postings (percent) and its relative change on a year earlier."""
    now = [mean_around(points, as_of) for points in series[AI_SHARE].values()]
    then = [mean_around(points, as_of - dt.timedelta(days=365)) for points in series[AI_SHARE].values()]
    now = [v for v in now if v]
    then = [v for v in then if v]
    if not now or not then:
        return None, None
    current, earlier = sum(now) / len(now), sum(then) / len(then)
    return current, current / earlier - 1


# ---------------------------------------------------------------------------
# 5. Skill momentum: mentions in Hacker News "Who is hiring?" threads

HN_DIR = CACHE / "hn"
HN_API = "https://hn.algolia.com/api/v1/"


def load_hn_threads(since: dt.date) -> list[dict]:
    listing = fetch_json(
        HN_API + "search_by_date?tags=story,author_whoishiring&hitsPerPage=200",
        HN_DIR / "threads.json",
        refresh=REFRESH,
    )
    threads = []
    for hit in listing["hits"]:
        title = hit.get("title") or ""
        day = dt.date.fromisoformat(hit["created_at"][:10])
        if not title.lower().startswith("ask hn: who is hiring") or day < since:
            continue
        cached = HN_DIR / f"thread_{hit['objectID']}.json"
        # Threads keep collecting comments for a few weeks; refresh only the recent ones.
        recent = (TODAY - day).days < 45
        data = fetch_json(
            HN_API + f"search?tags=comment,story_{hit['objectID']}&hitsPerPage=1000",
            cached,
            refresh=REFRESH and recent,
        )
        posts = [
            re.sub(r"<[^>]+>", " ", html.unescape(c.get("comment_text") or ""))
            for c in data["hits"]
            if str(c.get("parent_id")) == hit["objectID"]
        ]
        threads.append({"date": day, "posts": posts})
        time.sleep(0.2)
    source(
        "hn",
        name="Hacker News “Who is hiring?” threads (via Algolia HN API)",
        publisher="Y Combinator / Algolia",
        url="https://hn.algolia.com/api",
        licence="Counts only; text not stored",
        published=max(t["date"] for t in threads).isoformat(),
        note="Monthly hiring threads; mostly US and remote tech start-ups, so software skills are best covered.",
    )
    return sorted(threads, key=lambda t: t["date"])


def alias_regex(alias: str) -> re.Pattern:
    """Mirror of the web app's CV matcher (src/lib/engine.ts)."""
    sensitive = alias.startswith("=")
    phrase = re.escape(alias[1:] if sensitive else alias)
    return re.compile(rf"(?<![A-Za-z0-9]){phrase}(?:e?s)?(?![A-Za-z0-9+#])", 0 if sensitive else re.IGNORECASE)


def skill_mentions(threads: list[dict], skills: list[dict]) -> dict[str, list[tuple[dt.date, int, int]]]:
    """Per skill: (thread date, posts mentioning it, total posts)."""
    patterns = {s["id"]: [alias_regex(a) for a in s["aliases"]] for s in skills}
    result: dict[str, list[tuple[dt.date, int, int]]] = defaultdict(list)
    for thread in threads:
        for skill_id, regexes in patterns.items():
            hits = sum(1 for post in thread["posts"] if any(r.search(post) for r in regexes))
            result[skill_id].append((thread["date"], hits, len(thread["posts"])))
    return result


def momentum_at(series: list[tuple[dt.date, int, int]], as_of: dt.date) -> tuple[float, int]:
    """Relative change in mention share, last 6 months vs the 6 before; ±50% maps to ±1."""
    def window(start_days: int, end_days: int):
        rows = [r for r in series if as_of - dt.timedelta(days=start_days) < r[0] <= as_of - dt.timedelta(days=end_days)]
        hits = sum(r[1] for r in rows)
        total = sum(r[2] for r in rows)
        return hits, total

    recent_hits, recent_total = window(183, 0)
    prior_hits, prior_total = window(366, 183)
    if recent_hits + prior_hits < 30 or not recent_total or not prior_total:
        return 0.0, recent_hits + prior_hits
    recent, prior = recent_hits / recent_total, prior_hits / prior_total
    return clamp((recent / prior - 1) / 0.5, -1, 1) if prior else 0.0, recent_hits + prior_hits


# ---------------------------------------------------------------------------
# 6. UN SDG goals and targets

SDG_COLOURS = {
    1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D", 5: "#FF3A21", 6: "#26BDE2",
    7: "#FCC30B", 8: "#A21942", 9: "#FD6925", 10: "#DD1367", 11: "#FD9D24", 12: "#BF8B2E",
    13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B", 16: "#00689D", 17: "#19486A",
}
SDG_SHORT = {
    1: "No poverty", 2: "Zero hunger", 3: "Good health and well-being", 4: "Quality education",
    5: "Gender equality", 6: "Clean water and sanitation", 7: "Affordable and clean energy",
    8: "Decent work and economic growth", 9: "Industry, innovation and infrastructure",
    10: "Reduced inequalities", 11: "Sustainable cities and communities",
    12: "Responsible consumption and production", 13: "Climate action", 14: "Life below water",
    15: "Life on land", 16: "Peace, justice and strong institutions", 17: "Partnerships for the goals",
}


def load_sdg():
    data = fetch_json(
        "https://unstats.un.org/sdgs/UNSDGAPIV5/v1/sdg/Goal/List?includechildren=true",
        CACHE / "sdg" / "goals.json",
    )
    source(
        "un-sdg",
        name="UN SDG Global Database — goals and targets",
        publisher="United Nations Statistics Division",
        url="https://unstats.un.org/sdgs/UNSDGAPIV5/swagger/index.html",
        licence="Cited",
        note="Goal and target wording. Goal colours follow the UN SDG communication guidelines.",
    )
    goals, targets = [], []
    for goal in data:
        number = int(goal["code"])
        goals.append({"goal": number, "title": SDG_SHORT[number], "color": SDG_COLOURS[number]})
        for target in goal.get("targets", []):
            targets.append({"id": target["code"], "goal": number, "text": target["description"].strip()})
    return sorted(goals, key=lambda g: g["goal"]), targets


# ---------------------------------------------------------------------------
# 7. Courses: Microsoft Learn (live durations) + hand-verified catalogue

LEVELS = {"beginner": "intro", "intermediate": "intermediate", "advanced": "advanced"}


def load_courses(skill_ids: set[str]) -> list[dict]:
    catalog = fetch_json(
        "https://learn.microsoft.com/api/catalog/?locale=en-us&type=learningPaths",
        CACHE / "mslearn" / "catalog.json",
        refresh=REFRESH,
    )
    source(
        "mslearn",
        name="Microsoft Learn Catalog API",
        publisher="Microsoft",
        url="https://learn.microsoft.com/en-us/training/support/catalog-api",
        licence="Microsoft APIs Terms of Use (links and metadata only)",
        note="Free learning paths; durations come from the API's duration_in_minutes field.",
    )
    by_uid = {path["uid"]: path for path in catalog["learningPaths"]}
    courses = []
    for pick in load_curated("mslearn.json")["paths"]:
        path = by_uid.get(pick["uid"])
        if not path:
            log(f"warning: Microsoft Learn path no longer in catalogue: {pick['uid']}")
            continue
        courses.append({
            "id": "mslearn-" + pick["uid"].split(".")[-1],
            "title": path["title"],
            "provider": "Microsoft Learn",
            "url": path["url"].split("?")[0],
            "hours": round(path["duration_in_minutes"] / 60, 1),
            "cost": "free",
            "level": pick.get("level") or LEVELS.get(path["levels"][0], "intro"),
            "skills": [s for s in pick["skills"] if s in skill_ids],
            "sources": ["mslearn"],
        })

    verified_path = CURATED / "courses.json"
    if verified_path.exists():
        verified = json.loads(verified_path.read_text(encoding="utf-8"))
        source(
            "course-checks",
            name="SkillTide course checks",
            publisher="SkillTide team",
            url="https://github.com/ArcueidMP/skilltide/blob/main/pipeline/curated/courses.json",
            licence="CC BY 4.0",
            published=verified.get("checked"),
            note="Each course's hours and cost were read from the provider's own page; quotes and links are kept with the course.",
        )
        for course in verified["courses"]:
            skills = [s for s in course["skills"] if s in skill_ids]
            if not skills:
                continue
            courses.append({
                "id": course["id"],
                "title": course["title"],
                "provider": course["provider"],
                "url": course["url"],
                "hours": float(course["hours"]),
                "cost": course["cost"],
                "costNote": course.get("cost_note"),
                "level": course["level"],
                "skills": skills,
                "sources": ["course-checks"],
                "evidence": course.get("evidence", []),
            })
    return courses


# ---------------------------------------------------------------------------
# 8. Roles: tasks, skill requirements with evidence, SDG links with evidence

def compile_keywords(patterns: list[str]) -> list[re.Pattern]:
    return [re.compile(p if p.startswith("\\b") else rf"(?<![a-z]){p}", re.IGNORECASE) for p in patterns]


# Programming languages, in the order used to break ties (most transferable first).
LANGUAGE_PREFERENCE = {"python": 0, "javascript": 1, "java": 2, "c-cpp": 3, "csharp": 4, "r-lang": 5}

# Rated elements that are broad (maths, communication) count for less than specific skills.
ELEMENT_WEIGHT = {"math": 0.8, "technical-writing": 0.85, "communication": 0.85, "teamwork": 0.85, "problem-solving": 0.85, "project-management": 0.85}


def level_from_lv(lv: float | None) -> int:
    if lv is None:
        return 2
    return 1 if lv < 3 else 2  # entry-level hires are not expected at the top of O*NET's scale


def build_roles(onet, skills: list[dict], robot: dict[str, float]) -> list[dict]:
    curated_roles = load_curated("roles.json")["roles"]
    rules = load_curated("sdg_rules.json")
    skill_keywords = {s["id"]: compile_keywords(s.get("task_keywords", [])) for s in skills}
    rule_keywords = [(r, compile_keywords(r["keywords"])) for r in rules["rules"]]

    # How many roles list each skill's technologies; near-universal tools (Excel) are discounted.
    tech_presence = Counter()
    for role in curated_roles:
        listed = onet["software"].get(role["onet"], {})
        for skill in skills:
            if any(listed.get(name, (False, False))[1] for name in skill.get("onet_tech", [])):
                tech_presence[skill["id"]] += 1

    roles = []
    for spec in curated_roles:
        code = spec["onet"]
        occupation = onet["occupations"][code]
        tasks = []
        for task in onet["tasks"][code]:
            weight = onet["importance"].get((code, task["id"]), 3.0)
            tasks.append({"id": task["id"], "statement": task["statement"], "weight": round(weight, 2)})
        total_weight = sum(t["weight"] for t in tasks) or 1.0

        requirements = []
        listed = onet["software"].get(code, {})
        for skill in skills:
            evidence, score, level = [], 0.0, None
            # Technologies O*NET lists for the occupation.
            matched = [(name, *listed[name]) for name in skill.get("onet_tech", []) if name in listed]
            if matched:
                # "In Demand" is specific to this occupation's job postings; "Hot" is market-wide.
                best = max((0.85 + 0.15 * hot) if demand else (0.35 if hot else 0.25) for _, hot, demand in matched)
                if tech_presence[skill["id"]] > 0.6 * len(curated_roles):
                    best *= 0.6  # near-universal tools such as Excel
                    level = 1
                score = max(score, best)
                tags = []
                for name, hot, demand in matched[:3]:
                    flags = [label for label, on in (("hot technology", hot), ("in demand", demand)) if on]
                    tags.append(name + (f" ({', '.join(flags)})" if flags else ""))
                evidence.append("O*NET lists " + "; ".join(tags))
            # Rated O*NET skill / knowledge elements.
            for element in skill.get("onet_elements", []):
                rating = onet["elements"].get((element["file"], code, element["id"]))
                if not rating or "IM" not in rating:
                    continue
                im = rating["IM"]
                if im >= 3.25:
                    score = max(score, (im - 1) / 4 * ELEMENT_WEIGHT.get(skill["id"], 1.0))
                    level = max(level or 0, level_from_lv(rating.get("LV")))
                    evidence.append(f"O*NET importance {im:.1f}/5")
            # Task statements that mention the skill.
            hits = [t for t in tasks if any(k.search(t["statement"]) for k in skill_keywords[skill["id"]])]
            if hits:
                share = sum(t["weight"] for t in hits) / total_weight
                score = max(score, min(1.0, 0.45 + 1.5 * share))
                evidence.append(f"{len(hits)} of {len(tasks)} O*NET tasks mention it, e.g. “{hits[0]['statement']}”")
            if score < 0.4:
                continue
            requirements.append({
                "skillId": skill["id"],
                "importance": round(score, 3),
                "level": level or (2 if score >= 0.6 else 1),
                "evidence": evidence,
            })
        requirements.sort(key=lambda r: (-r["importance"], LANGUAGE_PREFERENCE.get(r["skillId"], 0)))
        # Graduates need one or two languages, not every one employers list.
        languages_kept = 0
        trimmed = []
        for requirement in requirements:
            if requirement["skillId"] in LANGUAGE_PREFERENCE:
                if languages_kept >= 2:
                    continue
                languages_kept += 1
            trimmed.append(requirement)
        requirements = trimmed
        # Keep technical skills in front: at most two general human skills per role.
        human_ids = {sk["id"] for sk in skills if sk["cluster"] == "human" and sk["id"] != "spreadsheets"}
        kept, human_kept = [], 0
        for requirement in requirements:
            if requirement["skillId"] in human_ids:
                if human_kept >= 2:
                    continue
                human_kept += 1
            kept.append(requirement)
        requirements = kept[:14]

        # SDG links: strongest task match per target, top three targets.
        candidates = []
        for rule, keywords in rule_keywords:
            hits = [t for t in tasks if any(k.search(t["statement"]) for k in keywords)]
            if hits:
                strength = sum(t["weight"] for t in hits) / total_weight
                top = max(hits, key=lambda t: t["weight"])
                candidates.append((strength, rule, top))
        candidates.sort(key=lambda c: -c[0])
        links = [
            {
                "targetId": rule["target"],
                "rationale": f"This role {rule['why']}.",
                "task": top["statement"],
                "sources": ["onet", "un-sdg"],
            }
            for _, rule, top in candidates[: rules["max_links_per_role"]]
        ]
        if not links:
            links = [{
                "targetId": rules["default"]["target"],
                "rationale": rules["default"]["why"][0].upper() + rules["default"]["why"][1:] + ".",
                "sources": ["un-sdg"],
                "default": True,
            }]

        roles.append({
            "id": spec["id"],
            "title": spec["title"],
            "onetTitle": occupation["Title"],
            "family": spec["family"],
            "summary": occupation["Description"].strip(),
            "onetCode": code,
            "jobZone": onet["job_zones"].get(code),
            "reportedTitles": onet["titles"].get(code, [])[:6],
            "robotExposure": robot.get(code),
            "newTasks": onet["new_tasks"].get(code, [])[:4],
            "indeedSectors": spec["indeed"],
            "tasks": tasks,
            "skills": requirements,
            "sdg": links,
            "sources": ["onet"],
        })
    return roles


def skill_sdg_targets(skills: list[dict], roles: list[dict]) -> dict[str, list[str]]:
    """Every skill builds SDG 4.4; it also inherits targets from the roles that rely on it most."""
    rules = load_curated("sdg_rules.json")
    base = rules["skill_target"]["target"]
    result = {}
    for skill in skills:
        counts = Counter()
        for role in roles:
            need = next((r for r in role["skills"] if r["skillId"] == skill["id"]), None)
            if need and need["importance"] >= 0.6:
                for link in role["sdg"]:
                    if not link.get("default"):
                        counts[link["targetId"]] += need["importance"]
        result[skill["id"]] = [base] + [t for t, _ in counts.most_common(3) if t != base][:2]
    return result


# ---------------------------------------------------------------------------
# 9. Snapshots: one per AEI release, plus "latest" with today's demand data

def task_lookup(release: dict, task_id: str, texts: list[str], table: str):
    values = release[table]
    if release["keyed_by"] == "id" and task_id in values:
        return values[task_id]
    for text in texts:
        if text in values:
            return values[text]
    return None


USE_FLOOR = 0.2


def build_snapshots(releases, roles, skills, beta_by_id, beta_by_text, old_texts, indeed, hn_counts):
    snapshots = []
    latest_indeed = max(day for name, sector in indeed.items() if name not in (MARKET, AI_SHARE) for pts in sector.values() for day, _ in pts)
    plan = [(r, dt.date.fromisoformat(r["release"]), r["id"]) for r in releases]
    plan.append((releases[-1], min(TODAY, latest_indeed), "latest"))

    for release, as_of, snap_id in plan:
        if release["keyed_by"] == "id":
            base_values = [v for k, v in release["usage"].items() if k.isdigit()]
            auto_values = [v for k, v in release["automation"].items() if k.isdigit()]
        else:
            base_values = list(release["usage"].values())
            auto_values = list(release["automation"].values())
        p90 = percentile(base_values, 0.9) or 1.0
        global_auto = statistics.mean(auto_values) if auto_values else 0.45

        task_signals, my_share = {}, {}
        for role in roles:
            known_auto, pending = [], []
            seen_my = weight_my = 0.0
            for task in role["tasks"]:
                texts = [norm_task(task["statement"])] + sorted(old_texts.get(task["id"], set()))
                beta = beta_by_id.get(task["id"])
                if beta is None:
                    beta = next((beta_by_text[t] for t in texts if t in beta_by_text), None)
                if beta is None:
                    continue
                pct = task_lookup(release, task["id"], texts, "usage")
                # A published row means the task passed the AEI's usage threshold, even if its
                # share rounds to 0.00; such tasks get the floor intensity.
                use = 0.0 if pct is None else clamp(pct / p90, USE_FLOOR, 1.0)
                auto = task_lookup(release, task["id"], texts, "automation")
                if auto is not None:
                    known_auto.append(auto)
                pending.append((task["id"], beta, use, auto))
                weight_my += task["weight"]
                if task_lookup(release, task["id"], texts, "usage_my") is not None:
                    seen_my += task["weight"]
            role_auto = statistics.mean(known_auto) if known_auto else global_auto
            for task_id, beta, use, auto in pending:
                task_signals[task_id] = {
                    "current": round(beta * use, 4),
                    "ceiling": beta,
                    "automation": round(auto if auto is not None else role_auto, 4),
                }
            my_share[role["id"]] = round(seen_my / weight_my, 3) if weight_my else 0.0

        # Demand is relative to all postings, so a hiring cycle that hits every sector cancels out.
        market = sector_yoy(indeed, MARKET, as_of) or 0.0
        role_signals = {}
        for role in roles:
            changes = [c for c in (sector_yoy(indeed, s, as_of) for s in role["indeedSectors"]) if c is not None]
            yoy = sum(changes) / len(changes) if changes else market
            role_signals[role["id"]] = {
                "demand": round(clamp((yoy - market) / 0.15, -1, 1), 3),
                "postingsYoY": round(yoy, 4),
                "malaysiaTaskShare": my_share[role["id"]],
            }

        ai_share, ai_yoy = ai_share_at(indeed, as_of)
        skill_signals = {}
        for skill in skills:
            value, mentions = momentum_at(hn_counts[skill["id"]], as_of)
            if skill["id"] in AI_SKILLS and ai_yoy is not None:
                # AI skills also follow the AI share of all postings (a broader signal than HN).
                value = 0.5 * value + 0.5 * clamp(ai_yoy / 0.5, -1, 1)
            skill_signals[skill["id"]] = {"momentum": round(value, 3), "mentions": mentions}

        snapshots.append({
            "id": snap_id,
            "asOf": as_of.isoformat(),
            "label": as_of.strftime("%b %Y") if snap_id != "latest" else f"Latest ({as_of.strftime('%d %b %Y')})",
            "aiUsePeriod": release["period"],
            "aeiRelease": release["release"],
            "sources": ["aei", "eloundou", "indeed", "indeed-ai", "hn", "onet"],
            "malaysiaUsageIndex": release.get("my_index"),
            "marketPostingsYoY": round(market, 4),
            "aiPostingsShare": round(ai_share, 3) if ai_share is not None else None,
            "aiPostingsYoY": round(ai_yoy, 4) if ai_yoy is not None else None,
            "tasks": task_signals,
            "skills": skill_signals,
            "roles": role_signals,
        })
        log(f"snapshot {snap_id}: {len(task_signals)} task signals; AI use {release['period']}; demand as of {as_of}")
    return snapshots


def automation_trend(releases) -> list[dict]:
    """Usage-weighted share of Claude use that is automation rather than augmentation, per release."""
    points = []
    for release in releases:
        numerator = denominator = 0.0
        for key, pct in release["usage"].items():
            if release["keyed_by"] == "id" and not key.isdigit():
                continue
            share = release["automation"].get(key)
            if share is None or not pct:
                continue
            numerator += pct * share
            denominator += pct
        if denominator:
            points.append({"period": release["period"], "release": release["release"], "share": round(numerator / denominator, 4)})
    return points


def build_scenarios(releases) -> tuple[list[dict], dict]:
    trend = automation_trend(releases)
    first, last = trend[0], trend[-1]
    years = (dt.date.fromisoformat(last["release"]) - dt.date.fromisoformat(first["release"])).days / 365.25
    drift = max(0.0, (last["share"] - first["share"]) / years) if years > 0 else 0.0
    log(f"automation share {first['share']:.3f} -> {last['share']:.3f} over {years:.2f}y; drift {drift:.3f}/yr")
    basis = {"automationTrend": trend, "automationDrift": round(drift, 4), "years": round(years, 2)}
    scenarios = [
        {
            "id": "moderate",
            "label": "Moderate AI",
            "adoptionRate": 0.15,
            "automationDrift": 0.0,
            "description": (
                "Each year AI use closes 15% of the gap between how much it is used on a task today and what current "
                "models could do, and the split between automating and assisting stays as observed today."
            ),
            "assumption": "The 15% yearly pace is SkillTide's assumption, not a measured rate.",
            "sources": ["aei", "eloundou"],
        },
        {
            "id": "fast",
            "label": "Fast AI",
            "adoptionRate": 0.35,
            "automationDrift": round(drift, 4),
            "description": (
                "AI use closes 35% of the remaining gap each year, and the shift from assisting to automating keeps going "
                f"at the pace measured in the Anthropic Economic Index ({first['share']:.0%} of use was automation in "
                f"{first['period']}, {last['share']:.0%} in {last['period']})."
            ),
            "assumption": "The 35% yearly pace is SkillTide's assumption; the automation trend is measured.",
            "sources": ["aei", "eloundou"],
        },
    ]
    return scenarios, basis


# ---------------------------------------------------------------------------
# 10. Assemble

def main() -> None:
    log("loading O*NET")
    onet = load_onet()
    log("loading Eloundou exposure labels")
    beta_by_id, beta_by_text = load_eloundou()

    # Older task wordings, so AEI releases keyed on text still join to O*NET 31.0 task ids.
    old_texts: dict[str, set[str]] = defaultdict(set)
    for row in read_csv(ELOUNDOU_DIR / "full_labelset.tsv", delimiter="\t"):
        old_texts[row["Task ID"].split(".")[0]].add(norm_task(row["Task"]))
    for row in read_csv(aei_path("release_2025_02_10/onet_task_statements.csv")):
        old_texts[row["Task ID"]].add(norm_task(row["Task"]))

    register_aei_sources()
    releases = []
    for release in AEI_RELEASES:
        log(f"loading AEI release {release['release']}")
        releases.append(load_aei_release(release))
    robot = load_robot_exposure()

    log("loading Indeed postings")
    indeed = load_indeed()

    skills_spec = load_curated("skills.json")["skills"]
    log("loading Hacker News hiring threads")
    threads = load_hn_threads(since=dt.date(2024, 3, 1))
    hn_counts = skill_mentions(threads, skills_spec)

    log("building roles")
    roles = build_roles(onet, skills_spec, robot)
    sdg_by_skill = skill_sdg_targets(skills_spec, roles)
    skills = [
        {
            "id": s["id"],
            "name": s["name"],
            "aliases": s["aliases"],
            "cluster": s["cluster"],
            "sdg": sdg_by_skill[s["id"]],
            "sources": ["onet"],
        }
        for s in skills_spec
    ]

    log("loading SDG goals and targets")
    goals, targets = load_sdg()
    used_targets = {link["targetId"] for r in roles for link in r["sdg"]} | {t for s in skills for t in s["sdg"]}
    targets = [t for t in targets if t["id"] in used_targets]

    log("loading courses")
    courses = load_courses({s["id"] for s in skills})

    scenarios, basis = build_scenarios(releases)
    snapshots = build_snapshots(releases, roles, skills_spec, beta_by_id, beta_by_text, old_texts, indeed, hn_counts)

    extras = {}
    emerging_path = CURATED / "emerging.json"
    if emerging_path.exists():
        extras = json.loads(emerging_path.read_text(encoding="utf-8"))
        mycol = extras.get("mycol") or {}
        source(
            "mycol",
            name=mycol.get("edition", "Malaysia Critical Occupations List (MyCOL)"),
            publisher="TalentCorp Malaysia",
            url=mycol.get("source_url", "https://www.talentcorp.com.my/mycol"),
            licence="Cited",
            published="2025",
            note="Occupations Malaysia finds hard to fill; a listed role gets a small local-demand bonus.",
        )
        source(
            "emerging",
            name="New-occupation lists and studies (MOHRSS China, TalentCorp, WEF)",
            publisher="Various; each item links to its own source",
            url="https://github.com/ArcueidMP/skilltide/blob/main/pipeline/curated/emerging.json",
            licence="Cited",
            published=extras.get("checked"),
        )
        listed = {}
        for match in mycol.get("matches", []):
            listed.setdefault(match["onet"], match["listed_title"])
        for role in roles:
            if role["onetCode"] in listed:
                role["mycol"] = {"listedTitle": listed[role["onetCode"]], "sources": ["mycol"]}

    dataset = {
        "generatedAt": TODAY.isoformat(),
        "horizonYears": 3,
        "scenarioBasis": basis,
        "sources": SOURCES,
        "scenarios": scenarios,
        "skills": skills,
        "roles": roles,
        "courses": courses,
        "sdgGoals": goals,
        "sdgTargets": targets,
        "snapshots": snapshots,
        "emergingRoles": extras.get("emerging_roles", []),
        "malaysiaContext": extras.get("malaysia_context", []),
        "mycol": extras.get("mycol"),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(dataset, ensure_ascii=False, indent=1), encoding="utf-8")
    log(
        f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB): "
        f"{len(roles)} roles, {len(skills)} skills, {len(courses)} courses, {len(snapshots)} snapshots"
    )


if __name__ == "__main__":
    main()
