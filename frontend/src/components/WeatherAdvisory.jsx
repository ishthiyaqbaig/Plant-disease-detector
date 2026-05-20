import React, { useState, useEffect } from "react";
import { speakText, stopSpeaking } from "../utils/speech";
import { Sun, CloudRain, Droplets, MapPin, Search, CloudAlert, Sparkles, RefreshCw, Volume2, VolumeX } from "lucide-react";

export default function WeatherAdvisory({ lang = "en", darkMode = true }) {
  const [weather, setWeather] = useState(null);
  const [cityInput, setCityInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Translation states
  const [translatedWeather, setTranslatedWeather] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchWeather = async (params = {}) => {
    setIsLoading(true);
    setError("");
    setTranslatedWeather(null);
    stopSpeaking();
    setIsSpeaking(false);
    try {
      const queryParams = new URLSearchParams();
      if (params.lat && params.lon) {
        queryParams.append("lat", params.lat);
        queryParams.append("lon", params.lon);
      } else if (params.city) {
        queryParams.append("city", params.city);
      }

      const response = await fetch(`http://localhost:7860/api/weather?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch weather: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setWeather(data);
    } catch (err) {
      console.error(err);
      setError(err.message || (lang === "te" ? "వాతావరణ వివరాలు పొందడం విఫలమైంది." : "Failed to load weather conditions."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    fetchWeather({ city: cityInput.trim() });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError(lang === "te" ? "ఈ బ్రౌజర్‌లో లొకేషన్ సపోర్ట్ లేదు." : "Geolocation is not supported by your browser.");
      fetchWeather({ city: "New Delhi" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (err) => {
        console.warn("Geolocation permission denied:", err);
        setError(lang === "te" ? "లొకేషన్ యాక్సెస్ తిరస్కరించబడింది. దయచేసి నగరాన్ని మాన్యువల్‌గా నమోదు చేయండి." : "Location access denied. Please type your city manually.");
        fetchWeather({ city: "Mumbai" });
      }
    );
  };

  // Detect location on mount
  useEffect(() => {
    handleDetectLocation();
  }, []);

  // Trigger translation when weather or lang changes
  useEffect(() => {
    if (!weather) {
      setTranslatedWeather(null);
      return;
    }

    if (lang === "te") {
      const performTranslation = async () => {
        setIsTranslating(true);
        try {
          const translate = async (text) => {
            const res = await fetch("http://localhost:7860/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, target: "te" }),
            });
            const data = await res.json();
            return data.translated_text || text;
          };

          const [tCity, tAdvisory] = await Promise.all([
            translate(weather.city_name),
            translate(weather.advisory),
          ]);

          setTranslatedWeather({
            city_name: tCity,
            advisory: tAdvisory,
          });
        } catch (err) {
          console.error("Weather translation error:", err);
        } finally {
          setIsTranslating(false);
        }
      };

      performTranslation();
    } else {
      setTranslatedWeather(null);
    }
  }, [weather, lang]);

  const handleSpeakToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (!weather) return;

    const displayCity = translatedWeather ? translatedWeather.city_name : weather.city_name;
    const displayAdvisory = translatedWeather ? translatedWeather.advisory : weather.advisory;

    let textToSpeak = "";
    if (lang === "te") {
      textToSpeak = `${displayCity} ప్రాంత వాతావరణం. ఉష్ణోగ్రత ${weather.temp} డిగ్రీల సెల్సియస్. తేమ ${weather.humidity} శాతం. వర్షపాతం ${weather.rainfall} మిల్లీమీటర్లు. వ్యవసాయ సలహా: ${displayAdvisory}`;
    } else {
      textToSpeak = `Weather conditions for ${displayCity}. Temperature is ${weather.temp} degrees Celsius, humidity is ${weather.humidity} percent, and rainfall is ${weather.rainfall} millimeters. Farmer advisory: ${displayAdvisory}`;
    }

    speakText(textToSpeak, lang);
    setIsSpeaking(true);

    if (window.speechSynthesis) {
      const checkSpeech = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
          clearInterval(checkSpeech);
        }
      }, 500);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className={`rounded-3xl p-6 border transition-all duration-300 ${
        darkMode
          ? "bg-slate-900/60 backdrop-blur-xl border-slate-800/80 text-slate-100 shadow-2xl"
          : "bg-white border-slate-200 text-slate-800 shadow-md hover:shadow-lg"
      } space-y-6`}>
        {/* Header and Manual Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Sun className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className={`text-md font-bold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                {lang === "te" ? "వాతావరణ సలహా కేంద్రం" : "Microclimate Advisory"}
              </h3>
              <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {lang === "te" ? "స్థానిక వాతావరణ ఆధారిత సిఫార్సులు" : "Localized farming weather diagnostics"}
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className={`flex items-center border rounded-xl px-3 py-1.5 focus-within:border-emerald-500/50 transition-colors w-full sm:w-auto ${
            darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-250"
          }`}>
            <input
              type="text"
              placeholder={lang === "te" ? "నగరం పేరు..." : "Search city..."}
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className={`bg-transparent text-xs outline-none w-full sm:w-32 ${
                darkMode ? "text-slate-205 placeholder-slate-505" : "text-slate-805 placeholder-slate-405"
              }`}
            />
            <button type="submit" disabled={isLoading} className="text-slate-450 hover:text-emerald-400 ml-1.5">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-slate-450">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>{lang === "te" ? "వాతావరణ సమాచారాన్ని పొందుతోంది..." : "Updating microclimate parameters..."}</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-300">
            <CloudAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">{lang === "te" ? "సమాచారం లభ్యం కాలేదు" : "Weather Unavailable"}</p>
              <p className="opacity-95">{error}</p>
              <button 
                onClick={handleDetectLocation}
                className="text-[11px] text-emerald-400 underline font-semibold mt-1 hover:text-emerald-300 block"
              >
                {lang === "te" ? "ఆటో నిర్ధారణను మళ్లీ ప్రయత్నించండి" : "Retry Auto-detection"}
              </button>
            </div>
          </div>
        )}

        {/* Translating State */}
        {isTranslating && (
          <div className={`flex items-center justify-center py-4 gap-2 text-xs rounded-2xl border transition-all duration-300 ${
            darkMode ? "bg-slate-950/20 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600 shadow-sm"
          }`}>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>అనువదిస్తోంది (Translating weather to Telugu)...</span>
          </div>
        )}

        {/* Weather advisory metrics */}
        {!isLoading && weather && !isTranslating && (
          <div className="space-y-6 animate-fadeIn">
            {/* Location Badge */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-450 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className={`font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                  {translatedWeather ? translatedWeather.city_name : weather.city_name}
                </span>
                {weather.mock && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ml-1 ${
                    darkMode ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}>
                    {lang === "te" ? "డెమో మోడ్" : "Demo Mode"}
                  </span>
                )}
              </span>
              
              <div className="flex items-center gap-3">
                {/* Voice speak weather button */}
                <button
                  onClick={handleSpeakToggle}
                  className={`text-[10px] flex items-center gap-1 font-semibold transition-colors ${
                    isSpeaking ? "text-red-400" : "text-emerald-400 hover:text-emerald-300"
                  }`}
                  title={lang === "te" ? "వాతావరణాన్ని వినండి" : "Listen to weather conditions"}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" /> {lang === "te" ? "ఆపుము" : "Stop"}
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" /> {lang === "te" ? "వినండి" : "Listen"}
                    </>
                  )}
                </button>

                <button 
                  onClick={handleDetectLocation} 
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" /> {lang === "te" ? "రిఫ్రెష్" : "Refresh"}
                </button>
              </div>
            </div>

            {/* Weather metrics values grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Temp metric */}
              <div className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 ${
                darkMode ? "bg-slate-950/30 border-slate-855" : "bg-slate-50 border-slate-200"
              }`}>
                <Sun className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {lang === "te" ? "ఉష్ణోగ్రత" : "Temperature"}
                  </p>
                  <p className={`text-lg font-extrabold mt-0.5 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{weather.temp}°C</p>
                </div>
              </div>

              {/* Humidity metric */}
              <div className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 ${
                darkMode ? "bg-slate-950/30 border-slate-855" : "bg-slate-50 border-slate-200"
              }`}>
                <Droplets className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {lang === "te" ? "తేమ" : "Humidity"}
                  </p>
                  <p className={`text-lg font-extrabold mt-0.5 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{weather.humidity}%</p>
                </div>
              </div>

              {/* Rainfall metric */}
              <div className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 ${
                darkMode ? "bg-slate-950/30 border-slate-855" : "bg-slate-50 border-slate-200"
              }`}>
                <CloudRain className="w-6 h-6 text-indigo-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {lang === "te" ? "వర్షపాతం" : "Rainfall"}
                  </p>
                  <p className={`text-lg font-extrabold mt-0.5 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{weather.rainfall} mm</p>
                </div>
              </div>
            </div>

            {/* Farming advisory card message */}
            <div className="space-y-2">
              <span className={`text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ${
                darkMode ? "text-slate-400" : "text-slate-550"
              }`}>
                <Sparkles className={`w-4 h-4 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                <span>{lang === "te" ? "రైతు వాతావరణ సలహా" : "Agricultural Advisory Advice"}</span>
              </span>
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                darkMode 
                  ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-300"
                  : "bg-emerald-50/60 border-emerald-200 text-emerald-800"
              }`}>
                {translatedWeather ? translatedWeather.advisory : weather.advisory}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
