import { describe, expect, it } from "vitest";
import { dataset } from "./data";
import { extractSkills } from "./engine";

describe("CV headings in Malay and Chinese", () => {
  const levels = (cv: string) =>
    Object.fromEntries(extractSkills(cv, dataset.skills).map((claim) => [claim.skillId, claim.level]));

  it("reads Malay section headings", () => {
    const cv = ["PENGALAMAN KERJA", "Pelatih ujian, menulis skrip Python", "PROJEK", "Talian pengisihan PLC", "KEMAHIRAN", "MATLAB"].join("\n");
    expect(levels(cv)).toMatchObject({ python: 3, plc: 2, matlab: 1 });
  });

  it("reads Chinese section headings", () => {
    const cv = ["工作经历", "实习：用 Python 写测试脚本", "项目经历", "PLC 分拣线", "专业技能：MATLAB"].join("\n");
    expect(levels(cv)).toMatchObject({ python: 3, plc: 2, matlab: 1 });
  });
});
