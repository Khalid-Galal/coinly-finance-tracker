import { describe, it, expect } from "vitest";
import { getSpeechRecognition, transcriptOf, type SpeechRecognitionCtor } from "./voice";

// GROUP_C gaps (TEST_PLAN §5 voice): standard-over-webkit precedence when both exist, and the
// optional-chaining guards in transcriptOf for malformed/empty event shapes.
const Standard = function () {} as unknown as SpeechRecognitionCtor;
const Webkit = function () {} as unknown as SpeechRecognitionCtor;

describe("getSpeechRecognition — precedence", () => {
  it("prefers the standard API when both standard and webkit are present", () => {
    expect(
      getSpeechRecognition({ SpeechRecognition: Standard, webkitSpeechRecognition: Webkit }),
    ).toBe(Standard);
  });
});

describe("transcriptOf — malformed events", () => {
  it("returns '' when results is missing entirely", () => {
    expect(transcriptOf({} as never)).toBe("");
  });

  it("returns '' when the first result has no alternatives", () => {
    expect(transcriptOf({ results: [[]] })).toBe("");
  });

  it("takes the top (first) alternative when several are present", () => {
    expect(transcriptOf({ results: [[{ transcript: "first" }, { transcript: "second" }]] })).toBe(
      "first",
    );
  });
});
