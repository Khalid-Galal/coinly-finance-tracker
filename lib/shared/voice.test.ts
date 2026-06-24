import { describe, it, expect } from "vitest";
import { getSpeechRecognition, transcriptOf, type SpeechRecognitionCtor } from "./voice";

const Ctor = function () {} as unknown as SpeechRecognitionCtor;

describe("getSpeechRecognition", () => {
  it("prefers the standard API, falls back to webkit, else null", () => {
    expect(getSpeechRecognition({ SpeechRecognition: Ctor })).toBe(Ctor);
    expect(getSpeechRecognition({ webkitSpeechRecognition: Ctor })).toBe(Ctor);
    expect(getSpeechRecognition({})).toBeNull();
  });
});

describe("transcriptOf", () => {
  it("extracts and trims the top transcript", () => {
    expect(transcriptOf({ results: [[{ transcript: "  how much did I spend  " }]] })).toBe(
      "how much did I spend",
    );
  });

  it("returns an empty string when there is no result", () => {
    expect(transcriptOf({ results: [] })).toBe("");
  });
});
