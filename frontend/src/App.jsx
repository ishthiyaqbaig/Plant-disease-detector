// src/App.jsx
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Languages, Moon, Sprout, Sun } from "lucide-react";
import NavBar from "./components/NavBar";
import PlantDiseaseDetector from "./components/PlantDiseaseDetector";
import HistoryPanel from "./components/HistoryPanel";
import WeatherAdvisory from "./components/WeatherAdvisory";
import { t } from "./utils/translation";

export default function App() {
  const [view, setView] = useState("diagnosis");
  const [lang, setLang] = useState("en");
  const [darkMode, setDarkMode] = useState(true);
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);

  const toggleLanguage = () => setLang((current) => (current === "en" ? "te" : "en"));

  return (
    <div
      className={`min-h-screen transition-all duration-300 flex flex-col items-center justify-start px-4 py-8 md:py-16 relative overflow-x-hidden ${
        darkMode ? "bg-[#080b11] text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] blur-[120px] pointer-events-none rounded-full ${
          darkMode ? "bg-emerald-500/5" : "bg-emerald-500/10"
        }`}
      />

      <div className="w-full max-w-6xl z-10 flex flex-col items-center space-y-8 px-2">
        <header className="w-full text-center flex flex-col items-center space-y-4">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-1.5 border rounded-full ${
                darkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50/80 border-emerald-200"
              }`}
            >
              <Sprout className="w-5 h-5 text-emerald-400" />
              <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                {t(lang, "portal")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${
                  darkMode
                    ? "bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title="Switch language"
              >
                <Languages className="w-4 h-4" />
                <span>{lang === "en" ? "తెలుగు" : "English"}</span>
              </button>

              <button
                type="button"
                onClick={() => setDarkMode((current) => !current)}
                className={`p-2.5 rounded-xl border transition-all ${
                  darkMode
                    ? "bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title={darkMode ? "Use light mode" : "Use dark mode"}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <h1 className={`text-4xl md:text-5xl font-black tracking-tight leading-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
              Ishthiyaq <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">AI Doctor</span>
            </h1>
            <p className={`text-sm max-w-md ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{t(lang, "subtitle")}</p>
          </div>
        </header>

        <NavBar view={view} onSelect={setView} lang={lang} darkMode={darkMode} />

        <div className="w-full min-h-[500px] flex justify-center items-start">
          <AnimatePresence mode="wait">
            {view === "diagnosis" ? (
              <motion.div
                key="diagnosis-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                <div className="lg:col-span-7 flex flex-col gap-6 w-full">
                  <PlantDiseaseDetector
                    lang={lang}
                    darkMode={darkMode}
                    onPredictionSuccess={() => setRefreshHistoryTrigger((prev) => prev + 1)}
                  />
                </div>
                <div className="lg:col-span-5 flex flex-col gap-6 w-full">
                  <WeatherAdvisory lang={lang} darkMode={darkMode} />
                  <HistoryPanel lang={lang} darkMode={darkMode} refreshTrigger={refreshHistoryTrigger} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <HistoryPanel lang={lang} darkMode={darkMode} refreshTrigger={refreshHistoryTrigger} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className={`mt-16 text-center text-xs tracking-wide font-medium z-10 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>
        &copy; {new Date().getFullYear()} Ishthiyaq AI Services. Connected to local API portal.
      </footer>
    </div>
  );
}
