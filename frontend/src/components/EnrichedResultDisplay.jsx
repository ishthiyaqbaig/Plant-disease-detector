import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

export default function EnrichedResultDisplay({ report }) {
  const [activeTab, setActiveTab] = useState("summary");
  const tabs = [
    { id: "summary", label: "Summary" },
    { id: "causes", label: "Causes" },
    { id: "symptoms", label: "Symptoms" },
    { id: "treatment", label: "Treatment" },
    { id: "prevention", label: "Prevention" },
    { id: "recommendations", label: "Recommendations" },
    { id: "warnings", label: "Warnings" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "summary":
        return <p className="text-sm text-slate-300">{report.summary}</p>;
      case "causes":
        return (
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            {report.causes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        );
      case "symptoms":
        return (
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            {report.symptoms.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        );
      case "treatment":
        return (
          <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
            {report.treatment}
          </pre>
        );
      case "prevention":
        return (
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            {report.prevention.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        );
      case "recommendations":
        return (
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            {report.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        );
      case "warnings":
        return (
          <ul className="list-disc list-inside text-sm text-amber-400 space-y-1">
            {report.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-100">{report.disease}</h2>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            report.severity.toLowerCase().includes("high")
              ? "bg-red-500/10 text-red-400"
              : report.severity.toLowerCase().includes("medium")
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}>{report.severity} Severity</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            report.risk_level.toLowerCase().includes("high")
              ? "bg-red-500/10 text-red-400"
              : report.risk_level.toLowerCase().includes("moderate")
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}>{report.risk_level}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-emerald-500/20 text-emerald-200"
                : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-2 text-left">{renderContent()}</div>
    </motion.div>
  );
}
