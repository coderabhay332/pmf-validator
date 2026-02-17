import type { PMFReport } from "@/types/pmf";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "./ScoreCard";
import { VerdictBadge } from "./VerdictBadge";
import { CompetitorTable } from "./CompetitorTable";
import { FixesAccordion } from "./FixesAccordion";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
    CheckCircle, AlertCircle, XCircle, Search, Rocket, BarChart3,
    Users, DollarSign, Target, Lightbulb, Activity, Layers, Code, Zap
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface PMFReportViewerProps {
    data: PMFReport;
}

export default function PMFReportViewer({ data }: PMFReportViewerProps) {
    const chartData = [
        { subject: 'Product', A: data.scores.productMaturity, fullMark: 10 },
        { subject: 'Readiness', A: data.scores.pmfReadiness, fullMark: 10 },
        { subject: 'Technical', A: data.scores.technicalQuality, fullMark: 10 },
        { subject: 'Market', A: data.scores.marketOpportunity, fullMark: 10 },
        { subject: 'Viability', A: data.scores.viability, fullMark: 10 },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 font-sans text-slate-900">

            {/* 1. Header Section */}
            <div className="space-y-6 text-center">
                <div className="flex flex-col items-center gap-4">
                    <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-widest text-slate-500 font-semibold bg-slate-100 border border-slate-200">
                        {data.category} Analysis
                    </Badge>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                        {data.product}
                    </h1>
                    <p className="text-sm text-slate-400 font-mono">
                        Analyzed on {data.date}
                    </p>
                </div>

                <div className="flex justify-center my-8">
                    <VerdictBadge verdict={data.recommendation} className="scale-125 shadow-lg" />
                </div>

                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-slate-800 leading-snug mb-4">
                        {data.oneLineVerdict}
                    </h2>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-indigo-900 relative">
                        <Lightbulb className="w-6 h-6 text-indigo-500 absolute top-4 left-4" />
                        <p className="pl-8 text-lg font-medium italic">
                            "{data.keyInsight}"
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* 2. Executive Score Grid */}
            <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Executive Scorecard</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <ScoreCard title="Product Maturity" score={data.scores.productMaturity} />
                    <ScoreCard title="PMF Readiness" score={data.scores.pmfReadiness} />
                    <ScoreCard title="Technical Quality" score={data.scores.technicalQuality} />
                    <ScoreCard title="Market Opportunity" score={data.scores.marketOpportunity} />
                    <ScoreCard title="Overall Viability" score={data.scores.viability} />
                </div>
            </section>

            {/* 3. Charts & Product Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Radar Chart */}
                <Card className="lg:col-span-1 shadow-sm h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-600">
                            <Activity className="w-4 h-4" /> Performance Radar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} max={10} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Radar
                                    name="Score"
                                    dataKey="A"
                                    stroke="#6366f1"
                                    fill="#818cf8"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Product Overview */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <Layers className="w-5 h-5 text-indigo-500" /> Product Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-slate-600 leading-relaxed text-base">
                            {data.sections.productOverview.summary}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.sections.productOverview.features.map((feature, i) => (
                                <div key={i} className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100 justify-between">
                                    <span className="font-medium text-slate-700 text-sm">{feature.name}</span>
                                    {feature.status === "Works Well" && <Badge variant="success" className="bg-emerald-100 text-emerald-800">Works Well</Badge>}
                                    {feature.status === "Partially Works" && <Badge variant="warning" className="bg-amber-100 text-amber-800">Partially Works</Badge>}
                                    {feature.status === "Broken/Missing" && <Badge variant="destructive" className="bg-red-100 text-red-800">Missing</Badge>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 4. Market & Competitors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <Target className="w-5 h-5 text-blue-500" /> Market Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            {data.sections.marketAnalysis.summary}
                        </p>
                        <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Competitive Landscape</h4>
                        <CompetitorTable competitors={data.sections.marketAnalysis.competitors} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <DollarSign className="w-5 h-5 text-emerald-500" /> Pricing & Value
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase">Pricing Model</h4>
                            <p className="text-slate-900 font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">
                                {data.sections.pricing.model}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase">Analysis</h4>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                {data.sections.pricing.analysis}
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase">Willingness to Pay</h4>
                            <p className="text-slate-600 leading-relaxed text-sm italic">
                                "{data.sections.willingness.evidence}"
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 5. PMF Diagnosis & Signals */}
            <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-indigo-900">
                        <Search className="w-5 h-5 text-indigo-600" /> PMF Diagnosis
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-semibold text-slate-700">7-Point Inspections</h4>
                            <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
                                Score: {data.sections.pmfDiagnosis.score}/7
                            </Badge>
                        </div>
                        <div className="space-y-3">
                            {data.sections.pmfDiagnosis.signals.map((signal, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    {signal.met ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
                                    )}
                                    <span className={cn("text-sm", signal.met ? "text-slate-900 font-medium" : "text-slate-500")}>
                                        {signal.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm">
                            <h4 className="font-bold text-indigo-900 mb-2">Diagnostic Verdict</h4>
                            <p className="text-slate-700 text-sm leading-relaxed">
                                {data.sections.pmfDiagnosis.verdict}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" /> Blind Spots & Risks
                            </h4>
                            <ul className="space-y-2">
                                {data.sections.blindSpots.risks.map((risk, i) => (
                                    <li key={i} className="text-sm text-slate-600 pl-4 border-l-2 border-amber-200">
                                        {risk}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 6. Technical & Growth (2 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Code className="w-5 h-5 text-slate-500" /> Technical Quality
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-600 text-sm">
                            {data.sections.technical.summary}
                        </p>
                        <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs">
                            {data.sections.technical.stackAnalysis}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Rocket className="w-5 h-5 text-purple-500" /> Growth & Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-600 text-sm">
                            {data.sections.growth.strategy}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {data.sections.growth.channels.map((channel, i) => (
                                <Badge key={i} variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                                    {channel}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 7. Action Plan & Fixes */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-900">Priority Fixes</h3>
                    <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                        Top 5 Issues
                    </Badge>
                </div>
                <FixesAccordion fixes={data.sections.fixes} />
            </section>

            {/* 8. Final Recommendation Banner */}
            <div className={cn(
                "rounded-2xl p-8 text-center text-white shadow-xl bg-gradient-to-r",
                data.recommendation === "SHIP" ? "from-emerald-600 to-teal-500" :
                    data.recommendation === "PIVOT" ? "from-amber-500 to-orange-500" :
                        "from-red-600 to-rose-600"
            )}>
                <h2 className="text-3xl font-extrabold mb-4 uppercase tracking-wider">
                    Final Recommendation: {data.recommendation}
                </h2>
                <p className="text-white/90 text-lg max-w-3xl mx-auto leading-relaxed mb-8">
                    {data.sections.finalRecommendation.reasoning}
                </p>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left max-w-2xl mx-auto">
                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5" /> Immediate Next Steps
                    </h4>
                    <ul className="space-y-3">
                        {data.sections.finalRecommendation.nextSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-white/90">
                                <span className="bg-white/20 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

        </div>
    );
}
