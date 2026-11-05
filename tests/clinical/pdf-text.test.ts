import { describe, expect, it } from "vitest";
import { pdfText } from "@/features/summary/pdf";

describe("PDF text sanitising", () => {
  it("keeps units unambiguous when superscripts can't be drawn", () => {
    expect(pdfText("15.8 ×10⁹/L")).toBe("15.8 ×10^9/L");
    expect(pdfText("mL/min/1.73m²")).toBe("mL/min/1.73m^2");
    expect(pdfText("×10³/µL")).toBe("×10^3/µL");
  });
  it("replaces comparison symbols", () => {
    expect(pdfText("HR ≥ 22, SBP ≤ 100")).toBe("HR >= 22, SBP <= 100");
  });
  it("keeps Latin-1 characters the font supports", () => {
    expect(pdfText("38.9 °C · µmol/L – ok")).toBe("38.9 °C · µmol/L – ok");
  });
  it("handles null/undefined", () => {
    expect(pdfText(null)).toBe("");
    expect(pdfText(undefined)).toBe("");
  });
});
