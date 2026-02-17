const input = `{
  "product": "IPCStudios",
  "category": "Photography & Wedding Studio ERP",
  "date": "2026-02-15",
  "recommendation": "KILL",
  "oneLineVerdict": "A technically unstable, niche ERP with broken core workflows and zero public positioning that fails to compete with established studio management tools.",
  "keyInsight": "The product lacks a functional 'Lead-to-Project' conversion pipeline—its most critical feature—rendering it unusable for its target audience.",
  "scores": {
    "productMaturity": 2,
    "pmfReadiness": 1,
    "technicalQuality": 2,
    "marketOpportunity": 4,
    "viability": 1
  },
  "sections": {
    "productOverview": {
      "summary": "An internal management system for photography studios to track enquiries, clients, attendance, and project deliverables.",
      "features": [
        { "name": "Enquiry Management", "status": "Works Well" },
        { "name": "Project Creation", "status": "Broken/Missing" },
        { "name": "Salary Management", "status": "Broken/Missing" },
        { "name": "Client Database", "status": "Partially Works" }
      ]
    },
    "marketAnalysis": {
      "summary": "The Indian wedding photography market is massive but fragmented; however, this tool fails to provide the professional polish required to win over studios from WhatsApp/Excel or specialized competitors.",
      "competitors": [
        { "name": "Studio Ninja", "differentiator": "Global standard, automated workflows", "pricing": "$249/yr" },
        { "name": "HoneyBook", "differentiator": "Superior client experience and payments", "pricing": "$39/mo" },
        { "name": "ShootQ", "differentiator": "Deep industry heritage", "pricing": "$40/mo" }
      ]
    },
    "pricing": { "model": "Unknown", "analysis": "⚠️ CRITICAL: Pricing information is completely missing. No public landing page or internal subscription settings found." },
    "ux": { "summary": "High friction and confusing navigation. The app relies on a lead-to-project workflow that fails to render.", "audit": ["No onboarding for new users", "Critical routes lead to blank screens", "Mandatory fields in forms are not clearly marked"] },
    "technical": { "summary": "Extremely unstable SPA with frequent loading hangs and routing failures.", "stackAnalysis": "React-based frontend with significant state management or API latency issues." },
    "value": { "proposition": "Centralized studio operations", "delivery": "Fails to deliver as core project management features are broken." },
    "willingness": { "summary": "Zero willingness to pay for a broken product.", "evidence": "Core 'Save Project' and 'Manage Salary' features failed during testing." },
    "growth": { "channels": ["Direct Sales", "Referrals"], "strategy": "Likely targeting local Indian studios via direct outreach given the lack of SEO/marketing." },
    "pmfDiagnosis": {
      "signals": [
        { "label": "Sean Ellis Test", "met": false },
        { "label": "Painkiller vs Vitamin", "met": false },
        { "label": "Low substitution threat", "met": false },
        { "label": "Organic growth evidence", "met": false },
        { "label": "Strong retention signals", "met": false },
        { "label": "High recommendation likelihood", "met": false },
        { "label": "10x better than alternatives", "met": false }
      ],
      "score": 0,
      "verdict": "The product is nowhere near PMF and lacks the basic stability to even begin validation."
    },
    "blindSpots": { "risks": ["Assuming users will tolerate broken workflows", "Lack of a public-facing value proposition"], "mitigation": "Build a landing page and fix core CRUD operations before seeking users." },
    "fixes": [
      { "title": "Fix Core Project Routing", "severity": "Critical", "impact": "Allows users to actually use the product", "plan": "Debug the 'Create Project from Lead' route and ensure data hydration.", "timeline": "1 week" },
      { "title": "Public Landing Page", "severity": "High", "impact": "Builds trust and explains value", "plan": "Create a simple marketing site with features and pricing.", "timeline": "2 weeks" }
    ],
    "finalRecommendation": { "reasoning": "The product is fundamentally broken at a technical level and offers no unique advantage over established, stable competitors. The lack of a landing page suggests it is either an internal tool masquerading as a product or a failed launch.", "nextSteps": ["Cease development on the current architecture", "Rebuild core workflows with a focus on stability", "Validate the niche with a manual concierge service before automating"] }
  }
}, so whenever i click result for specfic task it should render the data with the output data`;

// Parsing Logic Simulation
const getPMFData = (taskOutput) => {
    if (!taskOutput) return null;

    const validate = (data) => {
        return data && data.recommendation && data.scores && data.sections;
    };

    try {
        const output = taskOutput.trim();

        // 1. Try direct parse
        try {
            const parsed = JSON.parse(output);
            if (validate(parsed)) return { method: 'direct', parsed };
        } catch (e) {
            // console.log("Direct parse failed", e.message);
        }

        // 2. Try extracting from markdown code blocks
        const jsonBlockMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
            try {
                const parsed = JSON.parse(jsonBlockMatch[1]);
                if (validate(parsed)) return { method: 'markdown', parsed };
            } catch (e) {
                // console.log("Markdown parse failed", e.message);
            }
        }

        // 3. Fallback: Find first '{' and last '}'
        const firstBrace = output.indexOf('{');
        const lastBrace = output.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                const potentialJson = output.substring(firstBrace, lastBrace + 1);
                // escape unescaped newlines if necessary, but JSON.parse expects valid JSON
                const parsed = JSON.parse(potentialJson);
                if (validate(parsed)) return { method: 'fallback', parsed };
            } catch (e) {
                console.log("Fallback parse failed:", e.message);
                console.log("Snippet:", output.substring(firstBrace, firstBrace + 50) + "...");
            }
        }

        return null;
    } catch (e) {
        console.warn("Unexpected error in getPMFData:", e);
        return null;
    }
};

const result = getPMFData(input);
if (result) {
    console.log("SUCCESS! Parsed via method:", result.method);
    console.log("Product:", result.parsed.product);
} else {
    console.log("FAILED to parse.");
}
