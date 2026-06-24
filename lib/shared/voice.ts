// Minimal Web Speech API surface (US-F4). These types are not in the standard DOM
// lib, and the API is prefixed (webkit) in Chromium. Keeping this tiny + pure makes
// the cross-browser detection and transcript extraction testable without a real DOM.

export type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

export type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export type SpeechWindow = {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

/** The SpeechRecognition constructor for this browser, or null if unsupported. */
export function getSpeechRecognition(win: SpeechWindow): SpeechRecognitionCtor | null {
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

/** The top transcript from a recognition result event, trimmed. */
export function transcriptOf(e: SpeechRecognitionEventLike): string {
  return (e.results?.[0]?.[0]?.transcript ?? "").trim();
}
