import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertCircle, RefreshCw, Sparkles, Upload, Volume2, VolumeX } from "lucide-react";
import { predictPlantDisease } from "../services/api";
import { speakText, stopSpeaking } from "../utils/speech";
import { buildSpeechText, getResultText, t, translateDiagnosis } from "../utils/translation";

export default function PlantDiseaseDetector({ lang = "en", darkMode = true, onPredictionSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [translatedResult, setTranslatedResult] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const sampleLeafSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50 10 C30 35 15 55 15 70 C15 85 30 90 50 90 C70 90 85 85 85 70 C85 55 70 35 50 10 Z' fill='%2310B981'/><path d='M50 10 L50 90' stroke='%23047857' stroke-width='2'/><path d='M50 30 Q35 45 25 50M50 45 Q35 60 20 65M50 60 Q35 75 22 80M50 30 Q65 45 75 50M50 45 Q65 60 80 65M50 60 Q65 75 78 80' stroke='%23047857' stroke-width='1.5' fill='none'/></svg>";

  const displayResult = useMemo(() => {
    if (!result) return null;
    return lang === "te" && translatedResult ? translatedResult : getResultText(result);
  }, [lang, result, translatedResult]);

  useEffect(() => {
    let isMounted = true;

    async function translateCurrentResult() {
      if (!result || lang !== "te") {
        setTranslatedResult(null);
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);
      try {
        const translated = await translateDiagnosis(result, "te");
        if (isMounted) setTranslatedResult(translated);
      } catch (err) {
        console.error("Translation error:", err);
        if (isMounted) setTranslatedResult(null);
      } finally {
        if (isMounted) setIsTranslating(false);
      }
    }

    stopSpeaking();
    translateCurrentResult();

    return () => {
      isMounted = false;
    };
  }, [result, lang]);

  useEffect(() => () => stopSpeaking(), []);

  const resetResultState = () => {
    setResult(null);
    setTranslatedResult(null);
    setError("");
    stopSpeaking();
    setIsSpeaking(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t(lang, "invalidImage"));
      return;
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    resetResultState();
  };

  const handlePredict = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    resetResultState();

    try {
      const data = await predictPlantDisease(selectedFile);
      setResult(data);
      onPredictionSuccess?.();
    } catch (err) {
      console.error(err);
      setError(t(lang, "diagnoseError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryDemo = () => {
    setIsLoading(true);
    resetResultState();
    setPreviewUrl(sampleLeafSvg);
    setSelectedFile(new File(["demo"], "demo_leaf.png", { type: "image/png" }));

    window.setTimeout(() => {
      setResult({
        disease: "Tomato Mosaic Virus",
        confidence: 94.8,
        severity: "Medium",
        treatment:
          "Recommended actions:\n- Quarantine infected tomatoes immediately.\n- Sanitize tools and wash hands thoroughly with soap.\n- Remove nearby weeds that may harbor the virus.",
        explanation:
          "Tomato Mosaic Virus is a contagious plant disease that causes mottled leaves, weak growth, and reduced tomato production.",
      });
      setIsLoading(false);
      onPredictionSuccess?.();
    }, 900);
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    resetResultState();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSpeakToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (!displayResult || isTranslating) return;

    speakText(buildSpeechText(displayResult, lang), lang, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const getSeverityBadgeClass = (severity) => {
    const normalized = severity?.toLowerCase() || "";
    if (normalized.includes("high") || normalized.includes("ఎక్కువ")) {
      return "bg-red-500/10 text-red-400 border border-red-500/30";
    }
    if (normalized.includes("medium") || normalized.includes("మధ్యస్థ")) {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
    }
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center p-4">
      <div
        className={`w-full rounded-3xl p-5 md:p-8 border transition-all duration-300 ${
          darkMode
            ? "bg-slate-900/60 backdrop-blur-xl border-slate-800/80 text-slate-100 shadow-2xl"
            : "bg-white border-slate-200 text-slate-800 shadow-md hover:shadow-lg"
        } space-y-6`}
      >
        <div className="text-center space-y-2">
          <h2 className={`text-2xl font-bold flex items-center justify-center gap-2 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>{t(lang, "panelTitle")}</span>
          </h2>
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{t(lang, "panelDescription")}</p>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isLoading} />

        <button
          type="button"
          onClick={!previewUrl && !isLoading ? () => fileInputRef.current?.click() : undefined}
          className={`relative group w-full aspect-video md:aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
            previewUrl
              ? darkMode
                ? "border-slate-800 bg-slate-950/40"
                : "border-slate-300 bg-slate-50"
              : darkMode
                ? "border-slate-700 bg-slate-900/30 hover:border-emerald-500/50 hover:bg-slate-900/50 cursor-pointer"
                : "border-slate-300 bg-slate-50/50 hover:border-emerald-500/50 hover:bg-emerald-50/50 cursor-pointer"
          }`}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Plant leaf sample" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center space-y-4 text-center p-6">
              <div className={`p-4 rounded-full ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                <Upload className="w-10 h-10" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <p className={`text-base font-bold tracking-tight ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{t(lang, "uploadTitle")}</p>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{t(lang, "uploadHint")}</p>
              </div>
            </div>
          )}
        </button>

        {previewUrl && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {t(lang, "removeImage")}
          </button>
        )}

        {error && (
          <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">{t(lang, "errorTitle")}</p>
              <p className="mt-0.5 opacity-90">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[auto_auto_1fr] gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTryDemo}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
              darkMode
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100/50"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{t(lang, "tryDemo")}</span>
          </motion.button>

          {previewUrl && !isLoading && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClear}
              className={`px-5 py-2.5 font-semibold text-sm rounded-xl transition-all ${
                darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {t(lang, "clear")}
            </motion.button>
          )}

          <motion.button
            whileHover={selectedFile && !isLoading ? { scale: 1.02 } : {}}
            whileTap={selectedFile && !isLoading ? { scale: 0.98 } : {}}
            onClick={handlePredict}
            disabled={!selectedFile || isLoading}
            className={`px-8 py-2.5 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
              selectedFile && !isLoading
                ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white cursor-pointer"
                : darkMode
                  ? "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
          >
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{isLoading ? t(lang, "analyzing") : t(lang, "predict")}</span>
          </motion.button>
        </div>
      </div>

      {isTranslating && (
        <div
          className={`w-full mt-6 p-4 border rounded-2xl flex items-center justify-center gap-2 text-xs ${
            darkMode ? "bg-slate-900/60 border-slate-800/80 text-slate-400" : "bg-white border-slate-200 text-slate-600 shadow-md"
          }`}
        >
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>{t(lang, "translating")}</span>
        </div>
      )}

      {result && displayResult && !isTranslating && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`w-full mt-6 border rounded-3xl p-5 md:p-8 transition-all duration-300 ${
            darkMode
              ? "bg-slate-900/60 backdrop-blur-xl border-slate-800/80 text-slate-100 shadow-2xl"
              : "bg-white border-slate-200 text-slate-800 shadow-md hover:shadow-lg"
          } space-y-6`}
        >
          <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4 ${darkMode ? "border-slate-800/60" : "border-slate-200"}`}>
            <div className="min-w-0">
              <span className={`text-[10px] tracking-wider uppercase font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                {t(lang, "output")}
              </span>
              <h3 className={`text-xl font-extrabold mt-1 break-words ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{displayResult.disease}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSpeakToggle}
                className={`px-4 py-2 rounded-xl border transition-all text-sm font-bold flex items-center justify-center gap-2 min-w-28 ${
                  isSpeaking
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : darkMode
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                }`}
                title={isSpeaking ? t(lang, "stop") : t(lang, "speak")}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? t(lang, "stop") : `🔊 ${t(lang, "speak")}`}</span>
              </motion.button>

              <span className={`px-4 py-2 rounded-xl text-xs font-bold ${getSeverityBadgeClass(displayResult.severity)}`}>
                {displayResult.severity}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={darkMode ? "text-slate-400" : "text-slate-500"}>{t(lang, "confidence")}</span>
              <span className={`${darkMode ? "text-emerald-400" : "text-emerald-600"} font-bold`}>{displayResult.confidence}%</span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${displayResult.confidence}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
              />
            </div>
          </div>

          <div className="space-y-3">
            <span className={`text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              <Sparkles className={`w-4 h-4 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`} />
              <span>{t(lang, "details")}</span>
            </span>

            <div className={`p-4 rounded-2xl border text-sm leading-relaxed whitespace-pre-line ${darkMode ? "bg-slate-950/40 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
              <div className="font-bold mb-2">{lang === "te" ? "చికిత్స" : "Treatment"}</div>
              {displayResult.treatment}
            </div>

            {displayResult.explanation && (
              <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${darkMode ? "bg-slate-950/40 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                <div className="font-bold mb-2">{lang === "te" ? "వివరణ" : "Explanation"}</div>
                {displayResult.explanation}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
