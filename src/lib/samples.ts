// Synthetic sample students for the demo. These people and CVs are invented; the brief forbids
// real personal data. Skills are not stored here: they are extracted from each CV at load time.

import type { Locale } from "./i18n";
import type { Profile } from "./types";

export interface SamplePersona {
  id: string;
  /** Shown after the name on the sample button, in each interface language. Names and CVs stay in English. */
  tagline: Record<Locale, string>;
  profile: Profile;
  cv: string;
}

export const SAMPLE_PERSONAS: SamplePersona[] = [
  {
    id: "aina",
    tagline: {
      en: "Electrical & electronic, Penang test-floor intern",
      ms: "Elektrik & elektronik, pelatih kejuruteraan ujian di Pulau Pinang",
      zh: "电气与电子，槟城测试工程实习生",
    },
    profile: {
      name: "Aina Sofea",
      programme: "ee",
      graduation: "2027",
      skills: [],
      interests: ["energy", "electronics"],
      sdgGoals: [7, 9],
      hoursPerWeek: 8,
      budget: "free",
    },
    cv: `AINA SOFEA (sample student — synthetic profile)
Bachelor of Electrical and Electronic Engineering (Hons), final year

Relevant coursework
Circuit analysis, digital electronics, power electronics, signals and systems, MATLAB, C programming

Projects
Final-year project: maximum power point tracking for a small solar PV array, simulated in MATLAB and Simulink
Designed a two-layer PCB in KiCad for a battery monitoring board
Microcontroller data logger on Arduino, written in C

Industrial training
Test engineering intern, semiconductor back-end test site, Penang
Wrote Python scripts to parse tester logs and flag yield drops
Ran statistical process control charts in Excel for weekly yield reviews

Skills
Soldering, oscilloscope and multimeter use, technical report writing, teamwork`,
  },
  {
    id: "weijie",
    tagline: {
      en: "Computer science, Kuala Lumpur web intern",
      ms: "Sains komputer, pelatih web di Kuala Lumpur",
      zh: "计算机科学，吉隆坡网页开发实习生",
    },
    profile: {
      name: "Lim Wei Jie",
      programme: "cs",
      graduation: "2027",
      skills: [],
      interests: ["software", "ai-data"],
      sdgGoals: [4, 8],
      hoursPerWeek: 10,
      budget: "low",
    },
    cv: `LIM WEI JIE (sample student — synthetic profile)
Bachelor of Computer Science (Hons), final year

Relevant coursework
Data structures and algorithms, databases, software engineering, operating systems, machine learning

Projects
Final-year project: course-recommendation web app with React, Node.js and PostgreSQL
Built a REST API in Express with Jest unit tests
Kaggle notebook classifying news headlines with Python and scikit-learn

Internship
Software engineering intern, fintech start-up, Kuala Lumpur
Built React components in TypeScript and fixed bugs reported by users
Wrote SQL queries for monthly reports
Used Git and GitHub pull requests, Docker for local development
Did manual testing of release candidates

Skills
JavaScript, HTML, CSS, Java, presenting to stakeholders`,
  },
  {
    id: "kavin",
    tagline: {
      en: "Mechatronics, Johor factory automation intern",
      ms: "Mekatronik, pelatih automasi kilang di Johor",
      zh: "机电一体化，柔佛工厂自动化实习生",
    },
    profile: {
      name: "Kavin a/l Raj",
      programme: "mechatronics",
      graduation: "2026",
      skills: [],
      interests: ["automation", "electronics"],
      sdgGoals: [9, 12],
      hoursPerWeek: 6,
      budget: "free",
    },
    cv: `KAVIN A/L RAJ (sample student — synthetic profile)
Bachelor of Mechatronics Engineering (Hons), final year

Relevant coursework
Control systems, robotics, sensors and actuators, embedded systems, CAD

Projects
Final-year project: vision-guided pick-and-place arm using ROS and OpenCV in Python
Line-following robot on Arduino written in C++
Designed fixtures in SolidWorks

Industrial training
Automation intern, electronics manufacturing plant, Johor
Edited PLC ladder logic for a conveyor sorting station
Monitored the line on a SCADA dashboard and logged downtime
Helped with preventive maintenance of pneumatic actuators

Skills
AutoCAD, troubleshooting, Malay and English, working in shifts`,
  },
  {
    id: "nurul",
    tagline: {
      en: "Computer science, data analytics focus",
      ms: "Sains komputer, tumpuan analitik data",
      zh: "计算机科学，主攻数据分析",
    },
    profile: {
      name: "Nurul Izzah",
      programme: "cs",
      graduation: "2027",
      skills: [],
      interests: ["ai-data"],
      sdgGoals: [3, 9],
      hoursPerWeek: 8,
      budget: "free",
    },
    cv: `NURUL IZZAH (sample student — synthetic profile)
Bachelor of Computer Science (Data Science), final year

Relevant coursework
Statistics, data mining, machine learning, database systems, data visualisation

Projects
Final-year project: forecasting weekly dengue cases from open data with Python, pandas and scikit-learn
Dashboard of public transport ridership in Power BI
Cleaned survey data with R (tidyverse) for a campus study

Internship
Data analyst intern, logistics company, Selangor
Wrote SQL queries and built Excel pivot tables for delivery reports
Automated a weekly report with Python

Skills
Tableau, data storytelling, Bahasa Malaysia, English, Mandarin (basic)`,
  },
];
