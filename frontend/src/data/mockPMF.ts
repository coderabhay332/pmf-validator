import type { PMFReport } from "@/types/pmf";

export const MOCK_PMF_REPORT: PMFReport = {
    "product": "Memora",
    "category": "AI Knowledge Management / Second Brain",
    "date": "2026-02-15",
    "recommendation": "KILL",
    "oneLineVerdict": "A generic, buggy AI-note wrapper that fails its core promise of intelligent retrieval and lacks any monetization or differentiation strategy.",
    "keyInsight": "The product fails the 'Aha moment' because its primary differentiator—AI-powered search—returned zero results for a note created minutes prior, making it less reliable than a simple Ctrl+F.",
    "scores": {
        "productMaturity": 3,
        "pmfReadiness": 2,
        "technicalQuality": 4,
        "marketOpportunity": 8,
        "viability": 2
    },
    "sections": {
        "productOverview": {
            "summary": "Memora is an AI-powered knowledge base designed to capture and organize thoughts for professionals, promising instant retrieval via semantic search.",
            "features": [
                {
                    "name": "Note Creation",
                    "status": "Works Well"
                },
                {
                    "name": "Semantic Search/AI Chat",
                    "status": "Broken/Missing"
                },
                {
                    "name": "Collections & Tags",
                    "status": "Works Well"
                }
            ]
        },
        "marketAnalysis": {
            "summary": "The market is highly saturated with 'Prosumer' tools like Notion and Obsidian. Memora offers no unique wedge to compete.",
            "competitors": [
                {
                    "name": "Notion AI",
                    "differentiator": "Deep ecosystem integration",
                    "pricing": "Freemium"
                },
                {
                    "name": "Obsidian",
                    "differentiator": "Local-first, privacy-focused",
                    "pricing": "Free for personal"
                }
            ]
        },
        "pricing": {
            "model": "Unknown",
            "analysis": "Pricing link is non-functional; no visible tiers. This is a critical blocker for PMF and viability."
        },
        "ux": {
            "summary": "Standard SaaS dashboard but lacks onboarding and has high friction for AI features.",
            "audit": [
                "No onboarding tutorial",
                "AI search failed to find recent content",
                "Mobile layout is basic but functional"
            ]
        },
        "technical": {
            "summary": "React-based dashboard with inconsistent search indexing.",
            "stackAnalysis": "Likely using a standard LLM API with a basic vector database that lacks robust indexing."
        },
        "value": {
            "proposition": "AI-powered second brain",
            "delivery": "Fails to deliver; search is unreliable compared to competitors."
        },
        "willingness": {
            "summary": "Zero willingness to pay currently.",
            "evidence": "Users won't pay for a tool that is less reliable than free alternatives like Apple Notes or Google Keep."
        },
        "growth": {
            "channels": [
                "SEO",
                "Word of Mouth"
            ],
            "strategy": "Non-existent; no viral loops or sharing features observed."
        },
        "pmfDiagnosis": {
            "signals": [
                {
                    "label": "10x Better than alternatives",
                    "met": false
                },
                {
                    "label": "Painkiller vs Vitamin",
                    "met": false
                }
            ],
            "score": 1,
            "verdict": "The product is a 'Vitamin' that doesn't actually work as a vitamin yet."
        },
        "blindSpots": {
            "risks": [
                "Commoditized AI features",
                "High switching costs from Notion/Obsidian"
            ],
            "mitigation": "Focus on a hyper-specific niche (e.g., AI for medical research) rather than a general second brain."
        },
        "fixes": [
            {
                "title": "Fix Search Indexing",
                "severity": "Critical",
                "impact": "Core value delivery",
                "plan": "Implement robust RAG with better embedding strategies.",
                "timeline": "2 weeks"
            }
        ],
        "finalRecommendation": {
            "reasoning": "The product is a generic clone in a winner-take-most market. It fails technically on its core promise and has no business model.",
            "nextSteps": [
                "Shut down the general version",
                "Pivot to a specific professional vertical with high data-density needs"
            ]
        }
    }
};
