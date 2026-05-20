import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from "lucide-react";

export default function UploadZone({ onAnalyze, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    setError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, JPEG)");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Drag & Drop Card Container */}
      <motion.div
        className={`relative w-full max-w-xl aspect-video md:aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 cursor-pointer overflow-hidden transition-colors ${
          dragActive 
            ? "border-emerald-400 bg-emerald-950/20" 
            : "border-slate-700 bg-slate-900/40 hover:bg-slate-900/60"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={isLoading}
        />

        <AnimatePresence mode="wait">
          {!previewUrl ? (
            /* Upload Prompt view */
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400">
                <UploadCloud className="w-10 h-10" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-200">
                  Drag and drop your plant image
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  or click to browse from device
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-800 text-xs text-slate-400 rounded-md">
                Supports PNG, JPG, JPEG
              </span>
            </motion.div>
          ) : (
            /* Image Preview view */
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full group"
            >
              <img
                src={previewUrl}
                alt="Plant preview"
                className="w-full h-full object-cover"
              />
              {/* Overlay styling */}
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={handleReset}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform hover:scale-110 shadow-lg"
                  title="Remove image"
                  disabled={isLoading}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Validation Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-xl mt-4 px-4 py-3 bg-red-950/30 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="w-full max-w-xl mt-6 flex justify-end gap-3">
        {previewUrl && !isLoading && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleReset}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
          >
            Clear
          </motion.button>
        )}
        
        <motion.button
          disabled={!selectedFile || isLoading}
          onClick={handleSubmit}
          className={`px-8 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg ${
            selectedFile && !isLoading
              ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white cursor-pointer active:scale-95"
              : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
          }`}
          whileHover={selectedFile && !isLoading ? { translateY: -2 } : {}}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Analyzing Leaf...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-5 h-5" />
              <span>Diagnose Health</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
