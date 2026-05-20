// src/services/api.js
const API_BASE_URL = "http://localhost:7860";
/**
 * API service to connect to the plant disease detection microservice.
 */

/**
 * Sends a plant image file to the backend server to predict disease.
 * 
 * @param {File} imageFile - The image file to analyze.
 * @returns {Promise<Object>} - The structured JSON disease diagnosis { disease, confidence, severity, treatment }.
 */
export async function predictPlantDisease(imageFile) {
  const formData = new FormData();
  // Append the image file under the key "data" as required
  formData.append("data", imageFile);

  const response = await fetch(`${API_BASE_URL}/run/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server returned ${response.status}: ${errorText || response.statusText}`);
  }

  const jsonResponse = await response.json();

  if (jsonResponse.error) {
    throw new Error(jsonResponse.error);
  }

  if (!jsonResponse || !jsonResponse.data) {
    throw new Error("Invalid response format received from server.");
  }

  // Gradio/FastAPI returns response.data containing { disease, confidence, severity, treatment }
  return jsonResponse.data || jsonResponse;
}

/**
 * Sends raw prediction result to an LLM endpoint to generate enriched diagnostic report.
 * The backend is expected to accept a POST request at /api/enrich with the raw result JSON
 * and return the structured report matching the specification.
 * 
 * @param {Object} rawResult - The raw prediction output from predictPlantDisease.
 * @returns {Promise<Object>} - Enriched diagnostic report containing summary, causes, symptoms, treatment, prevention, risk_level, urgency, recommendations, warnings.
 */
export async function enrichResult(rawResult) {
  const response = await fetch(`${API_BASE_URL}/api/enrich`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rawResult),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Enrich API error ${response.status}: ${err}`);
  }

  const enriched = await response.json();
  return enriched;
}

export async function translateText(text, target = "te") {
  if (!text || target === "en") return text || "";

  const response = await fetch(`${API_BASE_URL}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target }),
  });

  if (!response.ok) {
    throw new Error(`Translate API error ${response.status}`);
  }

  const data = await response.json();
  return data.translated_text || text;
}
