import { translateText } from "../services/api";

export const LANGUAGES = {
  en: { code: "en", label: "English", speech: "en-US" },
  te: { code: "te", label: "తెలుగు", speech: "te-IN" },
};

const TELUGU_UI = {
  portal: "మొక్కల వ్యాధి నిర్ధారణ పోర్టల్",
  subtitle: "AI ఆధారిత పంట వ్యాధి సహాయకుడు",
  diagnosis: "నిర్ధారణ",
  history: "చరిత్ర",
  panelTitle: "ఆకు రోగ నిర్ధారణ",
  panelDescription: "తక్షణ AI నిర్ధారణ కోసం మీ మొక్క ఆకుల స్పష్టమైన ఫోటోను అప్లోడ్ చేయండి.",
  uploadTitle: "ప్రారంభించడానికి ఆకు చిత్రాన్ని అప్లోడ్ చేయండి",
  uploadHint: "రోగ నిర్ధారణ కోసం స్పష్టమైన ఆకు చిత్రాన్ని ఎంచుకోండి (PNG, JPG, JPEG)",
  invalidImage: "దయచేసి సరైన చిత్రం ఫైలును ఎంచుకోండి.",
  diagnoseError: "చిత్రాన్ని విశ్లేషించలేకపోయాం. దయచేసి మరింత స్పష్టమైన ఫోటోతో మళ్లీ ప్రయత్నించండి.",
  errorTitle: "ఆకు నిర్ధారణ లోపం",
  removeImage: "చిత్రం తొలగించు",
  tryDemo: "డెమో ప్రయత్నించండి",
  clear: "క్లియర్",
  analyzing: "విశ్లేషిస్తోంది...",
  predict: "నిర్ధారించు",
  translating: "తెలుగులోకి అనువదిస్తోంది...",
  output: "నిర్ధారణ నివేదిక",
  confidence: "నమ్మకం",
  details: "వ్యాధి వివరాలు, చికిత్స మరియు వివరణ",
  speak: "Speak",
  stop: "Stop",
};

const ENGLISH_UI = {
  portal: "Plant Disease Diagnostic Portal",
  subtitle: "AI-powered crop disease assistant",
  diagnosis: "Diagnosis",
  history: "History",
  panelTitle: "Leaf Diagnosis Panel",
  panelDescription: "Submit a clear photo of your plant foliage for immediate AI diagnostics.",
  uploadTitle: "Upload a leaf image to begin",
  uploadHint: "Upload a clear leaf image to detect disease (PNG, JPG, JPEG)",
  invalidImage: "Please select a valid image file.",
  diagnoseError: "Unable to analyze image. Please try again with a clearer photo.",
  errorTitle: "Error Diagnosing Leaf",
  removeImage: "Remove Image",
  tryDemo: "Try Demo",
  clear: "Clear",
  analyzing: "Analyzing...",
  predict: "Predict",
  translating: "Translating to Telugu...",
  output: "Diagnosis Output",
  confidence: "Model Confidence",
  details: "Diagnostic Details, Treatment & Explanation",
  speak: "Speak",
  stop: "Stop",
};

export function t(lang, key) {
  return (lang === "te" ? TELUGU_UI : ENGLISH_UI)[key] || ENGLISH_UI[key] || key;
}

export function getResultText(result) {
  const treatment = Array.isArray(result?.treatment_suggestions)
    ? result.treatment_suggestions.join("\n")
    : result?.treatment || "";

  return {
    disease: result?.disease || result?.disease_name || "Unknown disease",
    severity: result?.severity || "Unknown",
    confidence: result?.confidence ?? result?.confidence_score ?? 0,
    treatment,
    explanation: result?.explanation || "",
  };
}

export async function translateDiagnosis(result, target = "te") {
  if (target === "en") return getResultText(result);

  const normalized = getResultText(result);
  const [disease, severity, treatment, explanation] = await Promise.all([
    translateText(normalized.disease, target),
    translateText(`${normalized.severity} Severity`, target),
    translateText(normalized.treatment, target),
    normalized.explanation ? translateText(normalized.explanation, target) : Promise.resolve(""),
  ]);

  return {
    ...normalized,
    disease,
    severity,
    treatment,
    explanation,
  };
}

export function buildSpeechText(resultText, lang = "en") {
  if (lang === "te") {
    return [
      `వ్యాధి: ${resultText.disease}.`,
      `చికిత్స: ${resultText.treatment}.`,
      resultText.explanation ? `వివరణ: ${resultText.explanation}.` : "",
    ].join(" ");
  }

  return [
    `Disease: ${resultText.disease}.`,
    `Treatment: ${resultText.treatment}.`,
    resultText.explanation ? `Explanation: ${resultText.explanation}.` : "",
  ].join(" ");
}
