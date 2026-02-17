export type Verdict = "SHIP" | "PIVOT" | "KILL";

export interface PMFScore {
    productMaturity: number;
    pmfReadiness: number;
    technicalQuality: number;
    marketOpportunity: number;
    viability: number;
}

export interface Competitor {
    name: string;
    differentiator: string;
    pricing: string;
}

export interface Fix {
    title: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    impact: string;
    plan: string;
    timeline: string;
}

export interface Feature {
    name: string;
    status: "Works Well" | "Partially Works" | "Broken/Missing";
    notes?: string;
}

export interface ChecklistItem {
    label: string;
    met: boolean;
}

export interface PMFReport {
    product: string;
    category: string;
    date: string;
    recommendation: Verdict;
    oneLineVerdict: string;
    keyInsight: string;
    scores: PMFScore;
    sections: {
        productOverview: {
            summary: string;
            features: Feature[];
        };
        marketAnalysis: {
            summary: string;
            competitors: Competitor[];
        };
        pricing: {
            model: string;
            analysis: string;
        };
        ux: {
            summary: string;
            audit: string[];
        };
        technical: {
            summary: string;
            stackAnalysis: string;
        };
        value: {
            proposition: string;
            delivery: string;
        };
        willingness: {
            summary: string;
            evidence: string;
        };
        growth: {
            channels: string[];
            strategy: string;
        };
        pmfDiagnosis: {
            signals: ChecklistItem[];
            score: number; // e.g. 5/7
            verdict: string;
        };
        blindSpots: {
            risks: string[];
            mitigation: string;
        };
        fixes: Fix[];
        finalRecommendation: {
            reasoning: string;
            nextSteps: string[];
        };
    };
}
