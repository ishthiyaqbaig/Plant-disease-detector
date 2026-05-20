import React from "react";

export default function GradioEmbed() {
  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 md:p-6 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Gradio Workspace</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interact directly with the Gradio back-end Blocks GUI demonstration workspace.
          </p>
        </div>
      </div>
      
      {/* Embedded Iframe Container */}
      <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/40 relative shadow-inner">
        <iframe
          src="http://localhost:7860"
          title="Gradio App Interface"
          width="100%"
          height="600px"
          style={{ border: "none" }}
          className="bg-transparent"
        />
      </div>
    </div>
  );
}
