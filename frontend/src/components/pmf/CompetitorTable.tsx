import type { Competitor } from "@/types/pmf";

interface CompetitorTableProps {
    competitors: Competitor[];
}

export function CompetitorTable({ competitors }: CompetitorTableProps) {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-3">Competitor</th>
                        <th className="px-4 py-3">Differentiator</th>
                        <th className="px-4 py-3">Pricing</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {competitors.map((comp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900">{comp.name}</td>
                            <td className="px-4 py-3 text-slate-600">{comp.differentiator}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{comp.pricing}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
