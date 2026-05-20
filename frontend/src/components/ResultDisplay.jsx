import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

export default function ResultDisplay({ result }) {
  if (!result) return null;

  const { disease_name, confidence_score, severity, explanation, treatment_suggestions } = result;
  
  // Format confidence to percentage
  const confidencePercent = (confidence_score * 100).toFixed(1);

  // Helper for Severity color badges and icons
  const getSeverityConfig = (level) => {
    switch (level?.toLowerCase()) {
      case "low":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          label: "Low Severity",
          progressBar: "bg-emerald-500"
        };
      case "medium":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          label: "Medium Severity",
          progressBar: "bg-amber-500"
        };
      case "high":
        return {
          bg: "bg-red-500/10 border-red-500/30 text-red-400",
          icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
          label: "High Severity",
          progressBar: "bg-red-500"
        };
      default:
        return {
          bg: "bg-slate-500/10 border-slate-500/30 text-slate-400",
          icon: <ShieldCheck className="w-5 h-5 text-slate-400" />,
          label: "Unknown Severity",
          progressBar: "bg-emerald-500"
        };
    }
  };

  const severityConfig = getSeverityConfig(severity);

  // Variants for staggered entrance animation
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
    >
      {/* Decorative Gradient Background Blur */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">
            Diagnostics Report
          </span>
          <h2 className="text-2xl font-bold text-slate-100 mt-1 leading-tight">
            {disease_name}
          </h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 border rounded-full ${severityConfig.bg}`}>
          {severityConfig.icon}
          <span className="text-sm font-bold">{severityConfig.label}</span>
        </div>
      </div>

      {/* Confidence Meter Section */}
      <motion.div variants={itemVariants} className="mt-6">
        <div className="flex items-center justify-between text-sm font-semibold mb-2">
          <span className="text-slate-400">Diagnosis Confidence</span>
          <span className="text-emerald-400">{confidencePercent}%</span>
        </div>
        {/* Background Track */}
        <div className="w-full h-3 bg-slate-850 rounded-full overflow-hidden border border-slate-800/40">
          {/* Animated Progress bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidencePercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${severityConfig.progressBar}`}
          />
        </div>
      </motion.div>

      {/* AI Explanation Section */}
      <motion.div variants={itemVariants} className="mt-6 p-4 bg-slate-950/40 border border-slate-850/50 rounded-xl">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
          <Sparkles className="w-4 h-4" />
          <span>AI Explanation</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          {explanation}
        </p>
      </motion.div>

      {/* Treatment Suggestions Section */}
      <motion.div variants={itemVariants} className="mt-6">
        <h3 className="text-sm font-bold text-slate-400 tracking-wide uppercase mb-3">
          Recommended Action Steps
        </h3>
        <ul className="space-y-3">
          {treatment_suggestions?.map((treatment, idx) => (
            <motion.li
              key={idx}
              variants={itemVariants}
              className="flex items-start gap-3 text-slate-300 text-sm bg-slate-900/20 hover:bg-slate-950/20 p-2.5 rounded-lg border border-transparent hover:border-slate-850/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{treatment}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
