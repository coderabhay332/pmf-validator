import { cn } from "@/lib/utils";
import type { Verdict } from "@/types/pmf";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface VerdictBadgeProps {
    verdict: Verdict;
    className?: string;
}

export function VerdictBadge({ verdict, className }: VerdictBadgeProps) {
    const config = {
        SHIP: {
            color: "bg-emerald-100 text-emerald-800 border-emerald-200",
            icon: CheckCircle,
            label: "SHIP IT"
        },
        PIVOT: {
            color: "bg-yellow-100 text-yellow-800 border-yellow-200",
            icon: AlertTriangle,
            label: "PIVOT NEEDED"
        },
        KILL: {
            color: "bg-red-100 text-red-800 border-red-200",
            icon: XCircle,
            label: "KILL IT"
        }
    };

    const { color, icon: Icon, label } = config[verdict] || config["PIVOT"];

    return (
        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 shadow-sm bg-white", className)}>
            <span className={cn("flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border", color)}>
                <Icon className="w-3.5 h-3.5" />
                {verdict}
            </span>
            <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
    );
}
