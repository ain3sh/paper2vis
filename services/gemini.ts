import { GoogleGenAI, Type } from "@google/genai";

export const generateVisualizationFromPdf = async (
  pdfBase64: string, 
  customInstruction: string = "",
  onProgress?: (status: string) => void
): Promise<{ title: string; html: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (onProgress) onProgress("Reading Paper & Deconstructing Logic...");

  const modelName = 'gemini-3-pro-preview';

  const prompt = `
    You are a Distinguished Technical Communicator and 3D Data Visualization Expert.
    
    YOUR GOAL:
    The user has uploaded a research paper. Your job is to create an interactive 3D simulation that *teaches* the user how the system works.
    
    ${customInstruction ? `*** CRITICAL USER INSTRUCTION ***: The user wants you to focus specifically on: "${customInstruction}". Ensure the visualization highlights this aspect.` : ''}

    CRITICAL FAILURE MODES TO AVOID:
    - DO NOT create generic "sci-fi" art (e.g., a spinning glowing brain) that conveys no information.
    - DO NOT create abstract clouds of nodes unless they represent a specific vector space mentioned in the paper.
    - If the visual looks "cool" but fails to explain the *mechanism* of the paper, you have FAILED.

    ### 1. DEEP REASONING (Thinking Budget Usage)
    Use your thinking budget to Answer:
    1. **What is the Title?** Extract the exact paper title.
    2. **What is the State?** (e.g., In MemGPT, state = Main Context vs. External Context).
    3. **What is the Process?** (e.g., Data moves from Context -> LLM -> Tool -> Storage).
    4. **What is the Constraint?** (e.g., The limited context window size).
    
    You must map these abstract concepts to concrete 3D objects.
    - *Example:* A "Context Window" should be visualized as a container with limited capacity. If it fills up, show items falling out or being moved to a "Long Term Memory" storage container.

    ### 2. VISUALIZATION SPECIFICATION
    Create a SINGLE HTML file with Three.js (v0.160.0) that simulates the paper's core logic.

    **Core Requirements:**
    1.  **Architecture Diagram 3.0**: Instead of a 2D static diagram, build the system in 3D.
    2.  **Data Flow Animation**: Use moving particles (representing tokens, tensors, or signals) to show how information travels through the system. 
        - *Example:* If visualising Attention, show lines connecting Query to Key.
    3.  **Labeled Components**: You MUST use HTML overlays (absolute positioned divs) to label the parts of the system. A user must know what "Cube A" is (e.g., "Replay Buffer") and what "Cube B" is (e.g., "Policy Network").
    4.  **Interactive Inspection**: When a user hovers or clicks a component, show a tooltip explaining its specific role in this paper's architecture.

    ### 3. AESTHETICS VS. UTILITY
    - **Style**: "Clean, Modern Diagrammatic". Think *Apple Design* meets *Blueprint*.
    - **Background**: Dark, professional (#050508), grid floors are okay for reference.
    - **Post-Processing**: Use UnrealBloomPass sparingly to highlight *active* data processing, not just for decoration.
    
    ### 4. TECHNICAL SETUP
    - **Imports**:
      \`\`\`html
      <script type="importmap">
        {
          "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
          }
        }
      </script>
      \`\`\`
    - **Modules**: Import OrbitControls, EffectComposer, etc.
    - **UI Layer**: Create a sidebar or bottom panel in HTML/CSS overlay that acts as a "System Log" or "Legend", describing the simulation state in real-time.

    ### 5. OUTPUT FORMAT
    Return a JSON object containing:
    - "title": The extracted title of the paper.
    - "html": The raw HTML string for the visualization.
    
    **SUMMARY COMMAND:**
    Don't just show me the object. Show me how it *works*. Simulate the mechanism described in the PDF.
  `;

  try {
    if (onProgress) onProgress("Analyzing Architecture & Simulating Mechanics...");
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        // Maximize thinking budget within API limits (Limit is 65535)
        thinkingConfig: {
          thinkingBudget: 64000
        },
        temperature: 0.5, 
        candidateCount: 1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            html: { type: Type.STRING }
          },
          required: ["title", "html"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    if (!result.html) {
      throw new Error("Gemini generated an empty response.");
    }

    return {
      title: result.title || "Paper Visualization",
      html: result.html
    };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};