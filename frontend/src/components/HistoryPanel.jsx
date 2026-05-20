import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Calendar, Trash2, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

export default function HistoryPanel({ lang = "en", darkMode = true, refreshTrigger = 0, onClear }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const teluguMap = {
    "Tomato Mosaic Virus": "టమోటా మొజాయిక్ వైరస్",
    "Tomato Yellow Leaf Curl Virus": "టమోటా ఆకు ముడుత వైరస్",
    "Tomato Healthy": "టమోటా ఆరోగ్యకరమైనది",
    "High": "ఎక్కువ",
    "Medium": "మధ్యస్థం",
    "Low": "తక్కువ",
    "High Severity": "తీవ్రత ఎక్కువ",
    "Medium Severity": "తీవ్రత మధ్యస్థం",
    "Low Severity": "తీవ్రత తక్కువ"
  };

  const getTranslation = (text) => {
    if (lang !== "te") return text;
    return teluguMap[text] || teluguMap[text.replace(" Severity", "")] || text;
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:7860/api/history");
      if (!response.ok) {
        throw new Error("Failed to load prediction history.");
      }
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load past diagnostics.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm(lang === "te" ? "మీరు నిజంగా చరిత్రను క్లియర్ చేయాలనుకుంటున్నారా?" : "Are you sure you want to clear all prediction history?")) {
      return;
    }

    try {
      const response = await fetch("http://localhost:7860/api/history", {
        method: "DELETE",
      });
      if (response.ok) {
        setHistory([]);
        if (onClear) onClear();
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const getSeverityBadgeClass = (severity) => {
    const s = severity?.toLowerCase() || "";
    if (s.includes("low") || s.includes("తక్కువ")) {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (s.includes("medium") || s.includes("మధ్యస్థం")) {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
    return "bg-red-500/10 text-red-400 border border-red-500/20";
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className={`rounded-3xl p-6 border transition-all duration-300 ${
        darkMode
          ? "bg-slate-900/60 backdrop-blur-xl border-slate-800/80 text-slate-100 shadow-2xl"
          : "bg-white border-slate-200 text-slate-800 shadow-md hover:shadow-lg"
      } space-y-4`}>
        {/* Header section */}
        <div className={`flex items-center justify-between border-b pb-3 ${
          darkMode ? "border-slate-800/60" : "border-slate-200"
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-md font-bold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                {lang === "te" ? "నిర్ధారణ చరిత్ర" : "Diagnosis History"}
              </h3>
              <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-550"}`}>
                {lang === "te" ? "గత పరీక్షల లాగ్స్" : "Logs of past diagnostic runs"}
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className={`p-2 rounded-xl transition-all ${
                darkMode ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10" : "text-slate-500 hover:text-red-600 hover:bg-red-50"
              }`}
              title={lang === "te" ? "చరిత్ర క్లియర్ చేయి" : "Clear all history"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && history.length === 0 && (
          <div className="flex items-center justify-center py-8 gap-2 text-xs text-slate-450">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>{lang === "te" ? "చరిత్రను లోడ్ చేస్తోంది..." : "Retrieving history logs..."}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-center gap-2 text-red-300 text-xs">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Empty history log list */}
        {!isLoading && history.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <p className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-450"}`}>
              {lang === "te" ? "లాగ్స్ ఏవీ లేవు. మీ ఆకు రోగ నిర్ధారణను ప్రారంభించండి!" : "No history logs found. Start diagnosing leaves to log predictions!"}
            </p>
          </div>
        )}

        {/* Scrollable list of history items */}
        {history.length > 0 && (
          <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            <AnimatePresence initial={false}>
              {history.map((item) => (
                <motion.div
                  key={item.id || item.date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  layout
                  className={`border rounded-2xl p-3.5 flex items-center gap-4 transition-all hover:scale-[1.01] ${
                    darkMode
                      ? "bg-slate-955/40 hover:bg-slate-955/70 border-slate-850 hover:border-slate-800"
                      : "bg-slate-50 hover:bg-slate-100/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Image Preview */}
                  {item.image ? (
                    <div className={`w-14 h-14 rounded-xl overflow-hidden border flex-shrink-0 ${
                      darkMode ? "border-slate-800" : "border-slate-200"
                    }`}>
                      <img
                        src={item.image}
                        alt={item.disease}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`w-14 h-14 rounded-xl border flex-shrink-0 flex items-center justify-center ${
                      darkMode ? "bg-slate-900 border-slate-800 text-slate-600" : "bg-slate-100 border-slate-250 text-slate-400"
                    }`}>
                      <Calendar className="w-6 h-6" />
                    </div>
                  )}

                  {/* Details info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold truncate ${
                        darkMode ? "text-slate-200" : "text-slate-800"
                      }`}>
                        {getTranslation(item.disease)}
                      </p>
                      <span className={`text-[10px] font-bold flex-shrink-0 ${
                        darkMode ? "text-emerald-400" : "text-emerald-600"
                      }`}>
                        {item.confidence}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className={`w-3 h-3 ${darkMode ? "text-slate-600" : "text-slate-400"}`} />
                        <span>{item.date}</span>
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getSeverityBadgeClass(item.severity)}`}>
                        {getTranslation(item.severity)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
