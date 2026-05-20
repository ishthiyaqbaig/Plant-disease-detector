import { motion } from "framer-motion";
import { LayoutGrid, MonitorPlay } from "lucide-react";
import { t } from "../utils/translation";

export default function NavBar({ view, onSelect, lang, darkMode }) {
  const buttonBase = "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2";
  const activeClass = "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg";
  const inactiveClass = darkMode
    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100";

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect("diagnosis")}
        className={`${buttonBase} ${view === "diagnosis" ? activeClass : inactiveClass}`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>{t(lang, "diagnosis")}</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect("history")}
        className={`${buttonBase} ${view === "history" ? activeClass : inactiveClass}`}
      >
        <MonitorPlay className="w-4 h-4" />
        <span>{t(lang, "history")}</span>
      </motion.button>
    </div>
  );
}
