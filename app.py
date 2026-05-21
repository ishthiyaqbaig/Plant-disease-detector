import os
import io
import json
import random
import requests
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from PIL import Image

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI App
app = FastAPI(title="LeafScan AI Backend", description="FastAPI + Gradio backend for plant disease detection")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin e.g. ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Detect and configure Gemini SDK
GEMINI_CLIENT = None
GEMINI_SDK_TYPE = None

try:
    from google import genai
    from google.genai import types
    if os.environ.get("GEMINI_API_KEY"):
        GEMINI_CLIENT = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        GEMINI_SDK_TYPE = "genai"
        print("Gemini initialized using google-genai SDK.")
except ImportError:
    try:
        import google.generativeai as genai_legacy
        if os.environ.get("GEMINI_API_KEY"):
            genai_legacy.configure(api_key=os.environ.get("GEMINI_API_KEY"))
            GEMINI_CLIENT = genai_legacy
            GEMINI_SDK_TYPE = "legacy"
            print("Gemini initialized using google-generativeai legacy SDK.")
    except ImportError:
        pass

if not GEMINI_CLIENT:
    print("No Gemini SDK found or GEMINI_API_KEY not set. Backend will run in MOCK mode.")

# ----------------- MOCK DATABASE -----------------
MOCK_DISEASES = {
    "tomato_mosaic": {
        "disease": "Tomato Mosaic Virus",
        "confidence": 94.8,
        "severity": "Medium",
        "treatment": "Recommended actions:\n- Quarantine infected tomatoes immediately.\n- Sanitize tools and wash hands thoroughly with soap.\n- Remove nearby weeds that may harbor the virus.",
        "explanation": "Tomato Mosaic Virus is a contagious plant disease that causes mottled leaves, weak growth, and reduced tomato production."
    },
    "apple_scab": {
        "disease": "Apple Scab",
        "confidence": 89.2,
        "severity": "High",
        "treatment": "Recommended actions:\n- Remove and destroy all fallen leaves and infected fruit.\n- Apply appropriate organic or chemical fungicides in early spring.\n- Prune tree branches to improve air circulation and sunlight penetration.",
        "explanation": "Apple Scab is a fungal disease caused by Venturia inaequalis that produces dark, scabby lesions on leaves and fruit."
    },
    "corn_rust": {
        "disease": "Corn Common Rust",
        "confidence": 91.5,
        "severity": "Low",
        "treatment": "Recommended actions:\n- Plant rust-resistant corn hybrids.\n- Apply fungicides early if infection is severe.\n- Practice crop rotation and clear crop residue after harvest.",
        "explanation": "Common Rust is caused by the fungus Puccinia sorghi, producing powdery, reddish-brown pustules on both leaf surfaces."
    },
    "late_blight": {
        "disease": "Late Blight",
        "confidence": 96.4,
        "severity": "High",
        "treatment": "Recommended actions:\n- Remove and destroy infected plants immediately (do not compost).\n- Apply preventative copper fungicide sprays.\n- Avoid overhead watering to keep foliage dry.",
        "explanation": "Late Blight is a destructive disease caused by the oomycete Phytophthora infestans, capable of rapidly killing crop foliage and tubers."
    },
    "healthy": {
        "disease": "Healthy Plant foliage",
        "confidence": 99.1,
        "severity": "None",
        "treatment": "Recommended actions:\n- No treatment required.\n- Continue regular watering, soil monitoring, and organic fertilization.",
        "explanation": "The plant foliage looks completely healthy with no active signs of fungal, bacterial, or viral infection."
    }
}

MOCK_ENRICHED_REPORTS = {
    "Tomato Mosaic Virus": {
        "disease": "Tomato Mosaic Virus",
        "severity": "Medium Severity",
        "risk_level": "Moderate Risk",
        "summary": "Tomato Mosaic Virus (ToMV) is a highly persistent plant virus affecting tomato plants and other nightshade crops. It causes distinctive discoloration, leaflet curling, and severe yield reductions.",
        "causes": [
            "Transmission via contaminated hands, tools, or machinery during pruning/handling.",
            "Survival in infected crop residues and weeds in the soil.",
            "Infested seeds carrying the virus internally or on the seed coat."
        ],
        "symptoms": [
            "Mottling or mosaic patterns of light and dark green on leaflets.",
            "Fern-like leaf distortion and curling of foliage.",
            "Internal browning of the fruit walls in severe cases."
        ],
        "treatment": "There are no chemical cures for viral plant infections. Focus on control:\n1. Pull and incinerate infected plants immediately.\n2. Wash hands with nonfat dry milk solution or soap after handling infected foliage.\n3. Sanitize pruning shears with 10% bleach or virucidal agricultural solution.",
        "prevention": [
            "Use certified virus-free seeds.",
            "Plant resistant crop varieties (labeled Tm or similar).",
            "Maintain strict weed control, especially of Solanaceous weeds."
        ],
        "recommendations": [
            "Rotate crops with non-susceptible plants (e.g., corn, squash).",
            "Establish clean walkways and limit workers touching multiple plants.",
            "Test soil if continuous infections occur."
        ],
        "warnings": [
            "The virus can survive in dry plant debris for years.",
            "Avoid planting tomatoes in the same soil immediately after an outbreak."
        ]
    },
    "Apple Scab": {
        "disease": "Apple Scab",
        "severity": "High Severity",
        "risk_level": "High Risk",
        "summary": "Apple Scab is a major fungal disease caused by Venturia inaequalis. It attacks leaves, shoots, and fruit of apple and crabapple trees, severely reducing fruit quality and tree vigor.",
        "causes": [
            "Fungal spores overwintering on fallen leaves on the orchard floor.",
            "Ascospores released during spring rains, carried by wind to new green tissue.",
            "Secondary infections caused by conidia during warm, wet summer periods."
        ],
        "symptoms": [
            "Velvety olive-green lesions on the undersides of leaves.",
            "Lesions turn brown, corky, and scabby on leaves and developing fruit.",
            "Premature defoliation, leading to weakened trees."
        ],
        "treatment": "Fungal disease control requires active spraying:\n1. Apply organic sulfur or copper-based fungicides at bud break and green tip stages.\n2. Use systemic fungicides during peak ascospore release in spring.\n3. Apply horticultural oil to suppress spore development.",
        "prevention": [
            "Rake and destroy all fallen leaves in autumn to eliminate overwintering spores.",
            "Prune canopy aggressively to maximize airflow and rapid leaf drying.",
            "Plant scab-resistant cultivars like 'Liberty', 'Freedom', or 'GoldRush'."
        ],
        "recommendations": [
            "Irrigate trees at the base; avoid overhead sprinklers that wet leaves.",
            "Apply urea spray to leaves on the ground in fall to accelerate decay.",
            "Keep records of spring rain events to predict infection cycles."
        ],
        "warnings": [
            "Spores require as little as 9 hours of continuous leaf wetness to infect.",
            "Late-season leaf infections can cause storage rot in harvested apples."
        ]
    },
    "Corn Common Rust": {
        "disease": "Corn Common Rust",
        "severity": "Low Severity",
        "risk_level": "Low Risk",
        "summary": "Common Rust, caused by Puccinia sorghi, is a fungal disease that affects corn leaves, causing minor yield loss in most commercial fields but occasionally damaging sweet corn or seed corn.",
        "causes": [
            "Windblown spores arriving from southern climates or overwintering hosts.",
            "Cool, humid weather conditions (16-24°C) with prolonged dew periods."
        ],
        "symptoms": [
            "Elongated, powdery, reddish-brown pustules on both upper and lower leaf surfaces.",
            "Pustules turn blackish as the plant matures and produces overwintering spores.",
            "Leaf yellowing and early death of heavily infested leaves."
        ],
        "treatment": "Usually, no chemical treatment is needed for field corn. For sweet corn:\n1. Apply preventative strobilurin or triazole fungicides at the first sign of pustules.\n2. Use organic neem oil or sulfur-based sprays to slow spread.",
        "prevention": [
            "Select and plant rust-resistant corn hybrids.",
            "Practice proper crop rotation to break local pathogen load.",
            "Manage field density to promote light and ventilation."
        ],
        "recommendations": [
            "Monitor fields starting from mid-summer.",
            "Ensure proper nitrogen fertilization to support plant vigor."
        ],
        "warnings": [
            "High humidity (>95%) accelerates spore germination dramatically."
        ]
    },
    "Late Blight": {
        "disease": "Late Blight",
        "severity": "High Severity",
        "risk_level": "High Risk",
        "summary": "Late Blight is an extremely destructive disease of potatoes and tomatoes caused by the water mold Phytophthora infestans. It is infamous for causing the Irish Potato Famine and can destroy entire fields within days.",
        "causes": [
            "Infected seed tubers or volunteer potato plants acting as a source of spores.",
            "Cool, wet weather with frequent rain, fog, and high humidity.",
            "Spores transported over long distances by wind gusts."
        ],
        "symptoms": [
            "Water-soaked dark green/black lesions on leaves, often surrounded by a pale halo.",
            "White, fuzzy fungal-like growth on the leaf undersides in humid conditions.",
            "Dark brown leathery spots on tomato fruits or reddish-brown rot on potato tubers."
        ],
        "treatment": "Emergency actions are required immediately:\n1. Destroy infected plants immediately by bagging or burying (do not compost!).\n2. Apply protective copper fungicides weekly during high-risk weather windows.\n3. Apply chlorothalonil or specialized oomycete fungicides on surrounding healthy plants.",
        "prevention": [
            "Plant only certified disease-free seed tubers.",
            "Avoid overhead irrigation; use drip tapes.",
            "Ensure wide spacing between plants for rapid drying."
        ],
        "recommendations": [
            "Keep a daily log of humidity levels.",
            "Destructively harvest potatoes if late blight is present on stems to save tubers.",
            "Alert neighboring farms; late blight spores travel miles in the wind."
        ],
        "warnings": [
            "This disease spreads exponentially. A single infected leaf can produce millions of spores.",
            "Failure to act can destroy a whole crop within 48 to 72 hours."
        ]
    },
    "Healthy Plant foliage": {
        "disease": "Healthy Plant foliage",
        "severity": "None Severity",
        "risk_level": "Low Risk",
        "summary": "The analyzed leaf sample is healthy, displaying vibrant chlorophyll levels and showing no signs of fungal lesions, viral mottling, or bacterial rot.",
        "causes": [
            "Proper soil nutrition and organic matter.",
            "Good irrigation schedules and drainage.",
            "Resistant cultivars and clean cultivation practices."
        ],
        "symptoms": [
            "Even green color matching the variety standard.",
            "Strong turgor pressure and structural integrity.",
            "Clean leaf margins without spots or wilting."
        ],
        "treatment": "No disease treatments needed:\n1. Maintain current farming practices.\n2. Keep up regular soil testing and balanced organic fertilization.",
        "prevention": [
            "Maintain crop rotation schedules.",
            "Keep tools sanitized to prevent introducing pathogens.",
            "Routinely inspect crops weekly."
        ],
        "recommendations": [
            "Apply mulch to retain moisture and prevent soil splash-back.",
            "Continue standard watering early in the morning."
        ],
        "warnings": [
            "Remain vigilant; check undersides of lower leaves regularly for early signs of pests."
        ]
    }
}

MOCK_TRANSLATIONS = {
    "te": {
        "Tomato Mosaic Virus": "టమోటా మొజాయిక్ వైరస్",
        "Apple Scab": "ఆపిల్ స్కాబ్",
        "Corn Common Rust": "మొక్కజొన్న ఆకు తుప్పు తెగులు",
        "Late Blight": "ఆకు మాడు తెగులు (లేట్ బ్లైట్)",
        "Healthy Plant foliage": "ఆరోగ్యకరమైన ఆకులు",
        "Low Severity": "తక్కువ తీవ్రత",
        "Medium Severity": "మధ్యస్థ తీవ్రత",
        "High Severity": "ఎక్కువ తీవ్రత",
        "None Severity": "తీవ్రత లేదు",
        "Low": "తక్కువ",
        "Medium": "మధ్యస్థ",
        "High": "ఎక్కువ",
        "None": "ఏమీ లేదు",
        "Moderate Risk": "మధ్యస్థ ముప్పు",
        "High Risk": "ఎక్కువ ముప్పు",
        "Low Risk": "తక్కువ ముప్పు",
        "Recommended actions:\n- Quarantine infected tomatoes immediately.\n- Sanitize tools and wash hands thoroughly with soap.\n- Remove nearby weeds that may harbor the virus.": "సిఫార్సు చేయబడిన చర్యలు:\n- సోకిన టమోటాలను వెంటనే వేరు చేయండి.\n- పరికరాలను శుభ్రపరచండి మరియు చేతులను సబ్బుతో బాగా కడగాలి.\n- వైరస్ వ్యాప్తి చెందకుండా చుట్టుపక్కల ఉన్న కలుపు మొక్కలను తొలగించండి.",
        "Tomato Mosaic Virus is a contagious plant disease that causes mottled leaves, weak growth, and reduced tomato production.": "టమోటా మొజాయిక్ వైరస్ అనేది ఒక అంటువ్యాధి, ఇది ఆకులపై మచ్చలు, బలహీనమైన ఎదుగుదల మరియు తక్కువ టమోటా దిగుబడికి దారితీస్తుంది.",
        "Recommended actions:\n- Remove and destroy all fallen leaves and infected fruit.\n- Apply appropriate organic or chemical fungicides in early spring.\n- Prune tree branches to improve air circulation and sunlight penetration.": "సిఫార్సు చేయబడిన చర్యలు:\n- రాలిన ఆకులు మరియు సోకిన పండ్లన్నింటినీ సేకరించి నాశనం చేయండి.\n- వసంతకాలం ప్రారంభంలో తగిన సేంద్రీయ లేదా రసాయన శిలీంద్రనాశకాలను వాడండి.\n- గాలి ప్రసరణ మరియు సూర్యరశ్మి కోసం చెట్ల కొమ్మలను కత్తిరించండి.",
        "Apple Scab is a fungal disease caused by Venturia inaequalis that produces dark, scabby lesions on leaves and fruit.": "ఆపిల్ స్కాబ్ అనేది వెంచురియా ఇనేక్వాలిస్ అనే శిలీంద్రం వల్ల వచ్చే వ్యాధి, ఇది ఆకులు మరియు పండ్లపై ముదురు రంగు మచ్చలను కలిగిస్తుంది.",
        "Recommended actions:\n- Plant rust-resistant corn hybrids.\n- Apply fungicides early if infection is severe.\n- Practice crop rotation and clear crop residue after harvest.": "సిఫార్సు చేయబడిన చర్యలు:\n- తుప్పు తెగులును తట్టుకునే మొక్కజొన్న రకాలను నాటండి.\n- ఇన్ఫెక్షన్ ఎక్కువగా ఉంటే ముందే శిలీంద్రనాశకాలను చల్లండి.\n- పంట మార్పిడి పద్ధతిని పాటించండి మరియు కోత తర్వాత పంట వ్యర్థాలను శుభ్రం చేయండి.",
        "Common Rust is caused by the fungus Puccinia sorghi, producing powdery, reddish-brown pustules on both leaf surfaces.": "సాధారణ తుప్పు తెగులు పుస్సినియా సోర్గి శిలీంద్రం వల్ల వస్తుంది, ఇది ఆకు యొక్క రెండు వైపులా ఎరుపు-గోధుమ రంగు పొడి లాంటి మచ్చలను ఉత్పత్తి చేస్తుంది.",
        "Recommended actions:\n- Remove and destroy infected plants immediately (do not compost).\n- Apply preventative copper fungicide sprays.\n- Avoid overhead watering to keep foliage dry.": "సిఫార్సు చేయబడిన చర్యలు:\n- సోకిన మొక్కలను వెంటనే పీకి నాశనం చేయండి (కంపొస్ట్ చేయవద్దు).\n- ముందుజాగ్రత్తగా రాగి ఆధారిత శిలీంద్రనాశక స్ప్రేలను ఉపయోగించండి.\n- ఆకులు పొడిగా ఉండటానికి పైనుండి నీరు పోయడం నివారించండి.",
        "Late Blight is a destructive disease caused by the oomycete Phytophthora infestans, capable of rapidly killing crop foliage and tubers.": "ఆకు మాడు తెగులు (లేట్ బ్లైట్) అనేది ఫైటోఫ్తోరా ఇన్ఫెస్టాన్స్ వల్ల వచ్చే వినాశకరమైన తెగులు, ఇది పంట ఆకులను మరియు దుంపలను వేగంగా నాశనం చేస్తుంది.",
        "Recommended actions:\n- No treatment required.\n- Continue regular watering, soil monitoring, and organic fertilization.": "సిఫార్సు చేయబడిన చర్యలు:\n- చికిత్స అవసరం లేదు.\n- క్రమం తప్పకుండా నీరు పెట్టడం, నేల తనిఖీ మరియు సేంద్రీయ ఎరువుల వాడకాన్ని కొనసాగించండి.",
        "The plant foliage looks completely healthy with no active signs of fungal, bacterial, or viral infection.": "మొక్కల ఆకులు ఎటువంటి శిలీంద్ర, బ్యాక్టీరియా లేదా వైరల్ ఇన్ఫెక్షన్ లక్షణాలు లేకుండా పూర్తిగా ఆరోగ్యంగా ఉన్నాయి."
    }
}


# Helper functions
def diagnose_image(image_bytes: bytes, filename: str) -> dict:
    """Diagnoses a plant leaf image using Gemini or mock database based on filename heuristics."""
    if GEMINI_CLIENT:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            prompt = """
            Analyze this plant leaf image and detect any disease.
            Return a JSON response containing these EXACT keys:
            - disease: the name of the plant disease (e.g. "Tomato Mosaic Virus", "Apple Scab", "Corn Common Rust", "Late Blight", or "Healthy Plant foliage").
            - confidence: a float representing confidence score (0 to 100).
            - severity: severity level ("Low", "Medium", "High", or "None" if healthy).
            - treatment: clear, actionable bullet points of treatment and management options.
            - explanation: a brief explanation of what the disease is, how it spreads, and its impact.
            
            Return ONLY valid JSON.
            """
            
            if GEMINI_SDK_TYPE == "genai":
                response = GEMINI_CLIENT.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[image, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                raw_text = response.text
            else:
                # Legacy SDK
                response = GEMINI_CLIENT.GenerativeModel('gemini-2.5-flash').generate_content(
                    [image, prompt],
                    generation_config={"response_mime_type": "application/json"}
                )
                raw_text = response.text
                
            data = json.loads(raw_text)
            # Ensure data types
            data["confidence"] = float(data.get("confidence", 85.0))
            return data
        except Exception as e:
            print(f"Gemini diagnosis failed, falling back to mock classifier: {e}")
            
    # Heuristics based on filename
    fn = filename.lower()
    if "apple" in fn or "scab" in fn:
        return MOCK_DISEASES["apple_scab"]
    elif "corn" in fn or "rust" in fn:
        return MOCK_DISEASES["corn_rust"]
    elif "blight" in fn or "late" in fn or "potato" in fn:
        return MOCK_DISEASES["late_blight"]
    elif "healthy" in fn or "normal" in fn:
        return MOCK_DISEASES["healthy"]
    else:
        # random or default
        return MOCK_DISEASES["tomato_mosaic"]


# ----------------- FASTAPI ENDPOINTS -----------------

@app.post("/run/predict")
async def run_predict(data: UploadFile = File(...)):
    """API endpoint matching frontend prediction request."""
    try:
        content = await data.read()
        result = diagnose_image(content, data.filename)
        return {"data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/enrich")
async def api_enrich(raw: dict):
    """Generates an enriched agricultural report from a raw disease prediction."""
    disease = raw.get("disease", "Tomato Mosaic Virus")
    
    if GEMINI_CLIENT:
        try:
            prompt = f"""
            Based on this raw plant disease diagnosis, generate an enriched diagnostic report in JSON:
            Raw Diagnosis:
            Disease: {raw.get('disease')}
            Severity: {raw.get('severity')}
            Confidence: {raw.get('confidence')}%
            Treatment: {raw.get('treatment')}
            Explanation: {raw.get('explanation')}
            
            Return a JSON object containing these keys:
            - disease: name of the disease
            - severity: severity level (High Severity / Medium Severity / Low Severity / None Severity)
            - risk_level: Risk level for surrounding crop (High Risk / Moderate Risk / Low Risk)
            - summary: Detailed summary paragraph of the diagnosis.
            - causes: List of 3-5 primary causes of this disease.
            - symptoms: List of 3-5 key symptoms.
            - treatment: Detailed, formatted text instructions.
            - prevention: List of 3-5 preventative actions.
            - recommendations: List of 3-5 expert recommendations.
            - warnings: List of 2-3 warnings or critical notices.
            
            Return ONLY valid JSON.
            """
            
            if GEMINI_SDK_TYPE == "genai":
                response = GEMINI_CLIENT.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                raw_text = response.text
            else:
                response = GEMINI_CLIENT.GenerativeModel('gemini-2.5-flash').generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                raw_text = response.text
                
            return json.loads(raw_text)
        except Exception as e:
            print(f"Gemini enrichment failed: {e}")
            
    # Mock fallback
    # Match key in mock database
    matched_report = None
    for name, report in MOCK_ENRICHED_REPORTS.items():
        if disease.lower() in name.lower() or name.lower() in disease.lower():
            matched_report = report
            break
            
    if not matched_report:
        matched_report = MOCK_ENRICHED_REPORTS["Tomato Mosaic Virus"]
        
    return matched_report


class TranslateRequest(BaseModel):
    text: str
    target: str = "te"

@app.post("/api/translate")
async def api_translate(req: TranslateRequest):
    """Translates diagnostic text into Telugu or other target languages."""
    if not req.text.strip():
        return {"translated_text": ""}
        
    if req.target == "en":
        return {"translated_text": req.text}
        
    if GEMINI_CLIENT:
        try:
            prompt = f"Translate the following text to Telugu ({req.target}). Return only the direct translation. Do not add any conversational remarks, explanations, or extra tags. Keep list formatting or bullet points intact:\n\n{req.text}"
            
            if GEMINI_SDK_TYPE == "genai":
                response = GEMINI_CLIENT.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                translation = response.text
            else:
                response = GEMINI_CLIENT.GenerativeModel('gemini-2.5-flash').generate_content(prompt)
                translation = response.text
                
            return {"translated_text": translation.strip()}
        except Exception as e:
            print(f"Gemini translation failed: {e}")
            
    # Dictionary fallback for common UI/results text
    translated = MOCK_TRANSLATIONS.get(req.target, {}).get(req.text)
    if translated:
        return {"translated_text": translated}
        
    # If a larger paragraph, we can do mock translation sentence by sentence
    # or just return a default text
    if req.target == "te":
        if "High Severity" in req.text:
            return {"translated_text": "ఎక్కువ తీవ్రత"}
        elif "Medium Severity" in req.text:
            return {"translated_text": "మధ్యస్థ తీవ్రత"}
        elif "Low Severity" in req.text:
            return {"translated_text": "తక్కువ తీవ్రత"}
        return {"translated_text": f"[అనువాదం] {req.text}"}
        
    return {"translated_text": req.text}


@app.get("/api/weather")
async def api_weather(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    city: Optional[str] = None
):
    """Fetches local agricultural weather parameters and generates localized farmer advisories."""
    api_key = os.environ.get("OPENWEATHERMAP_API_KEY")
    weather_data = None
    city_name = city or "Hyderabad"
    
    if api_key:
        try:
            if lat is not None and lon is not None:
                url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
            else:
                url = f"https://api.openweathermap.org/data/2.5/weather?q={city_name}&appid={api_key}&units=metric"
                
            res = requests.get(url, timeout=5)
            if res.ok:
                weather_data = res.json()
                city_name = weather_data.get("name", city_name)
        except Exception as e:
            print(f"Failed to query OpenWeatherMap: {e}")
            
    # Compile weather parameters
    if weather_data:
        temp = weather_data["main"]["temp"]
        humidity = weather_data["main"]["humidity"]
        weather_description = weather_data["weather"][0]["description"]
        rainfall = weather_data.get("rain", {}).get("1h", 0.0)
        is_mock = False
    else:
        # Mock weather parameters
        temp = round(random.uniform(24.0, 36.0), 1)
        humidity = random.randint(50, 85)
        rainfall = round(random.choice([0.0, 0.0, 0.0, 1.2, 4.5, 0.0]), 1)
        weather_description = "scattered clouds" if rainfall == 0.0 else "moderate rain"
        is_mock = True
        
    # Generate advisory
    advisory = ""
    if GEMINI_CLIENT:
        try:
            prompt = f"""
            As an agricultural expert, write a short, practical 2-sentence farming advisory for a farmer in {city_name} with these weather conditions:
            Temperature: {temp}°C
            Humidity: {humidity}%
            Rainfall: {rainfall} mm
            Weather Description: {weather_description}
            
            Give clear advice on irrigation, crop safety, or pest protection today. Do not write introductory text.
            """
            if GEMINI_SDK_TYPE == "genai":
                response = GEMINI_CLIENT.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                advisory = response.text.strip()
            else:
                response = GEMINI_CLIENT.GenerativeModel('gemini-2.5-flash').generate_content(prompt)
                advisory = response.text.strip()
        except Exception as e:
            print(f"Gemini advisory generation failed: {e}")
            
    if not advisory:
        # Rule-based fallback advisory
        if rainfall > 4.0:
            advisory = "Moderate/heavy rainfall detected. Suspend all planned irrigation immediately and ensure clean field drainage pathways to prevent waterlogging and root rot."
        elif humidity > 80 and temp > 28:
            advisory = "High humidity and high temperature conditions present a high risk for fungal disease outbreaks. Inspect leaf undersides and suspend overhead spraying."
        elif temp > 33:
            advisory = "High temperature warning. Soil evaporation rates are elevated; irrigate crops during early morning or late evening hours and apply crop mulch to conserve moisture."
        else:
            advisory = "Current microclimate conditions are optimal. Maintain standard irrigation intervals, monitor crop foliage, and check for any early insect pests."
            
    return {
        "city_name": city_name,
        "temp": temp,
        "humidity": humidity,
        "rainfall": rainfall,
        "advisory": advisory,
        "mock": is_mock
    }


# ----------------- GRADIO MOUNT -----------------
import gradio as gr

def gradio_predict(img):
    if img is None:
        return "No image uploaded."
    
    # Compress/save image to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()
    
    res = diagnose_image(img_bytes, "gradio_upload.png")
    
    output = f"Disease: {res['disease']}\n"
    output += f"Confidence Score: {res['confidence']}%\n"
    output += f"Severity Level: {res['severity']}\n\n"
    output += "Treatment Suggestions:\n"
    output += f"{res['treatment']}\n\n"
    output += "Disease Explanation:\n"
    output += f"{res['explanation']}"
    return output

# Create Gradio interface
gr_interface = gr.Interface(
    fn=gradio_predict,
    inputs=gr.Image(type="pil", label="Upload leaf photo"),
    outputs=gr.Textbox(label="LeafScan Diagnostic Report", lines=12),
    title="LeafScan AI — Plant Disease Diagnostic Workspace",
    description="Backend verification interface. Upload a leaf image to test local or LLM-based detection models.",
    theme="soft"
)

# Mount Gradio on FastAPI app
app = gr.mount_gradio_app(app, gr_interface, path="/")

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 7860
    uvicorn.run(app, host="0.0.0.0", port=7860)
