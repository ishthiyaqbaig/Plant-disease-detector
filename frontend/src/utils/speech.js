const SPEECH_LANG = {
  en: "en-US",
  te: "te-IN",
};

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function normalizeSpeechText(text) {
  return String(text || "")
    .replace(/[*#_`>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickVoice(lang) {
  const speechLang = SPEECH_LANG[lang] || SPEECH_LANG.en;
  const voices = window.speechSynthesis.getVoices();

  return (
    voices.find((voice) => voice.lang === speechLang) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith(lang)) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("en")) ||
    null
  );
}

export function speakText(text, lang = "en", options = {}) {
  if (!isSpeechSupported()) {
    options.onError?.(new Error("Speech Synthesis API is not supported in this browser."));
    return null;
  }

  const cleanText = normalizeSpeechText(text);
  if (!cleanText) return null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = SPEECH_LANG[lang] || SPEECH_LANG.en;
  utterance.rate = lang === "te" ? 0.9 : 0.95;
  utterance.pitch = 1;

  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;

  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = (event) => options.onError?.(event);

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
