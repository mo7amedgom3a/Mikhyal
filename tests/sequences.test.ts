import { describe, expect, it } from "vitest";
import { sanitizeFeedback } from "@/lib/feedback";
import { classify, explicitCoefficients, explicitTerm, explicitTex, fmt, parseList, parseNumber, recursiveTerms, termIndexOf } from "@/lib/sequences";
import { PRACTICE } from "@/lib/sequences/practice";

describe("arithmetic sequences", () => {
  it("builds terms recursively and agrees with the general term", () => {
    expect(recursiveTerms(3, 2, 5)).toEqual([3, 5, 7, 9, 11]);
    expect(recursiveTerms(0.1, 0.2, 3)).toEqual([0.1, 0.3, 0.5]);
    for (const [a1, d] of [[9, 6], [4, -3], [-7, 1.5], [2, 0]])
      recursiveTerms(a1, d, 40).forEach((t, i) => expect(t).toBe(explicitTerm(a1, d, i + 1)));
  });

  it("solves the textbook exercise 14 (a1 = 9, d = 6)", () => {
    expect(explicitCoefficients(9, 6)).toEqual({ slope: 6, intercept: 3 });
    expect(explicitTex(9, 6)).toBe("6n + 3");
    expect(explicitTerm(9, 6, 10)).toBe(63);
    expect(explicitTex(4, -3)).toBe("-3n + 7");
    expect(explicitTex(1, 1)).toBe("n");
    expect(explicitTex(5, 0)).toBe("5");
  });

  it("classifies sequences and finds where the difference breaks", () => {
    expect(classify([3, 5, 7, 9])).toEqual({ status: "arithmetic", a1: 3, d: 2 });
    expect(classify([5, 5, 5])).toEqual({ status: "arithmetic", a1: 5, d: 0 });
    expect(classify([1, 2])).toEqual({ status: "too-short" });
    const g = classify([2, 4, 8, 16]);
    expect(g.status).toBe("not-arithmetic");
    if (g.status === "not-arithmetic") expect(g.breakAt).toBe(3);
  });

  it("parses typed lists with fractions, Arabic digits and Arabic commas", () => {
    expect(parseList("1/3, 1/12، 1/48")).toEqual([1 / 3, 1 / 12, 1 / 48]);
    expect(parseList("٣، ٥، ٧ ...")).toEqual([3, 5, 7]);
    expect(parseList("3, x")).toBeNull();
    expect(parseNumber("−3")).toBe(-3);
    expect(parseNumber("1/0")).toBeNull();
    expect(fmt(1 / 192)).toBe("\\tfrac{1}{192}");
    expect(fmt(-0.5)).toBe("-0.5");
    expect(fmt(-1 / 3)).toBe("-\\tfrac{1}{3}");
  });

  it("finds a term's position", () => {
    expect(termIndexOf(3, 4, 99)).toBe(25);
    expect(termIndexOf(3, 4, 100)).toBeNull();
    expect(termIndexOf(3, 4, -1)).toBeNull();
  });
});

describe("practice", () => {
  it("has answers consistent with the sequence functions", () => {
    const ex14 = PRACTICE.find((q) => q.id === "ex14");
    const ex13 = PRACTICE.find((q) => q.id === "ex13");
    if (ex14?.kind !== "fields" || ex13?.kind !== "fields") throw new Error("missing");
    expect(ex14.fields.map((f) => f.answer)).toEqual([explicitCoefficients(9, 6).slope, explicitCoefficients(9, 6).intercept, explicitTerm(9, 6, 10)]);
    expect(ex13.fields.map((f) => f.answer)).toEqual([explicitCoefficients(4, -3).slope, explicitCoefficients(4, -3).intercept, explicitTerm(4, -3, 10)]);
  });

  it("never lists the right answer as a known wrong value", () => {
    for (const q of PRACTICE) {
      if (q.kind === "fields") for (const f of q.fields) for (const w of f.wrong ?? []) expect(w.value).not.toBe(f.answer);
      else {
        expect(q.options.map((o) => o.id)).toContain(q.answer);
        expect(q.why[q.answer]).toBeUndefined();
      }
    }
  });
});

describe("feedback", () => {
  const valid = { lessonId: "arithmetic-sequences", understandingBefore: 2, understandingAfter: 4, simsHelpful: 5, versusClass: "better", activity: { secondsOnPage: 600, simsUsed: ["stairs", "race"], practice: { ex14: { attempts: 2, correct: true } } } };

  it("accepts a valid entry and clamps sizes", () => {
    const f = sanitizeFeedback({ ...valid, comment: "x".repeat(5000), name: "  سارة  " });
    expect(f?.comment).toHaveLength(2000);
    expect(f?.name).toBe("سارة");
    expect(f?.activity.practice.ex14).toEqual({ attempts: 2, correct: true });
  });

  it("rejects incomplete or malformed entries", () => {
    expect(sanitizeFeedback(null)).toBeNull();
    expect(sanitizeFeedback({ ...valid, simsHelpful: 9 })).toBeNull();
    expect(sanitizeFeedback({ ...valid, versusClass: "meh" })).toBeNull();
    expect(sanitizeFeedback({ ...valid, lessonId: "../etc" })).toBeNull();
    expect(sanitizeFeedback({ ...valid, activity: { simsUsed: ["<script>"] } })?.activity.simsUsed).toEqual([]);
  });
});
