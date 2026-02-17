import type { Fix } from "@/types/pmf";
import { ChevronDown, AlertCircle, Clock, Rocket } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FixesAccordionProps {
    fixes: Fix[];
}

export function FixesAccordion({ fixes }: FixesAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case "critical": return "bg-red-100 text-red-700 border-red-200";
            case "high": return "bg-orange-100 text-orange-700 border-orange-200";
            case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="space-y-3">
            {fixes.map((fix, idx) => {
                const isOpen = openIndex === idx;
                return (
                    <div key={idx} className="border border-slate-200 rounded-lg bg-white overflow-hidden transition-all shadow-sm hover:shadow-md">
                        <button
                            onClick={() => toggle(idx)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border", getSeverityColor(fix.severity))}>
                                    {fix.severity}
                                </span>
                                <span className="font-semibold text-slate-900">{fix.title}</span>
                            </div>
                            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
                        </button>

                        {isOpen && (
                            <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" /> Impact
                                        </label>
                                        <p className="text-sm text-slate-700">{fix.impact}</p>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                                            <Rocket className="w-3.5 h-3.5" /> Implementation Plan
                                        </label>
                                        <p className="text-sm text-slate-700">{fix.plan}</p>
                                    </div>
                                    <div className="space-y-1 md:col-span-3">
                                        <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> Timeline
                                        </label>
                                        <p className="text-sm text-slate-700 font-mono">{fix.timeline}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
