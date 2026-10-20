// Builds the static site and publishes it to the gh-pages branch that GitHub Pages serves.
// Use this until the "Deploy to GitHub Pages" workflow can run (it needs the workflow scope).
import { execSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

const REMOTE = process.env.PAGES_REMOTE ?? "https://github.com/ArcueidMP/skilltide.git";
const run = (command, options = {}) => execSync(command, { stdio: "inherit", ...options });

rmSync("out", { recursive: true, force: true });
run("npx next build", { env: { ...process.env, GITHUB_PAGES: "true" } });
writeFileSync("out/.nojekyll", "");
run("git init -q -b gh-pages", { cwd: "out" });
run("git add -A", { cwd: "out" });
run('git commit -q -m "Deploy SkillTide static site"', { cwd: "out" });
run(`git push -q --force ${REMOTE} gh-pages`, { cwd: "out" });
rmSync("out/.git", { recursive: true, force: true });
console.log("Published. GitHub Pages updates in about a minute: https://arcueidmp.github.io/skilltide/");
