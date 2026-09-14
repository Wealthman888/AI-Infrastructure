import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CONFIDENCE_LABELS, CREDIBILITY_DISCLAIMER, CredibilityPanel as CredibilityPanelData } from "@/lib/calculations/credibility";

export function CredibilityPanelCard({ panel }: { panel: CredibilityPanelData }) {
  const tone = panel.confidence === "high" ? "positive" : panel.confidence === "moderate" ? "warning" : "danger";
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Projection credibility</CardTitle>
        <Badge variant={tone}>{CONFIDENCE_LABELS[panel.confidence]}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Required inputs verified or client-provided</span>
            <span className="font-medium text-white">{panel.percentVerified}%</span>
          </div>
          <Progress value={panel.percentVerified} tone={tone === "positive" ? "positive" : tone === "warning" ? "warning" : "danger"} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Estimated inputs</p>
            <p className="font-medium text-warning">{panel.estimatedCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Missing inputs</p>
            <p className="font-medium text-danger">{panel.missingCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current baseline</p>
            <p className="font-medium text-white">{panel.hasCurrentBaseline ? "Available" : "Not available"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Best case</p>
            <p className="font-medium text-white">{panel.bestCaseCapacityConstrained ? "Capacity constrained" : "Within capacity"}</p>
          </div>
        </div>
        <p className="text-xs italic text-muted-foreground">{CREDIBILITY_DISCLAIMER}</p>
      </CardContent>
    </Card>
  );
}
