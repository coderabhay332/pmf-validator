import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
    title: string;
    score: number;
    maxScore?: number;
}

export function ScoreCard({ title, score, maxScore = 10 }: ScoreCardProps) {
    const percentage = (score / maxScore) * 100;

    let colorClass = "bg-red-500";
    let textColorClass = "text-red-600";

    if (score >= 7) {
        colorClass = "bg-emerald-500";
        textColorClass = "text-emerald-600";
    } else if (score >= 4) {
        colorClass = "bg-yellow-500";
        textColorClass = "text-yellow-600";
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between mb-2">
                    <span className={cn("text-3xl font-bold", textColorClass)}>
                        {score}
                        <span className="text-sm text-slate-400 font-normal">/{maxScore}</span>
                    </span>
                </div>
                <Progress value={percentage} indicatorClassName={colorClass} className="h-2" />
            </CardContent>
        </Card>
    );
}
