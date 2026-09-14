"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import {
  DEFAULT_SCENARIO_PRESETS,
  PRESET_LABELS,
  PresetKey,
  PresetSet,
  PresetTier,
  loadScenarioPresets,
  resetScenarioPresets,
  saveScenarioPresets,
} from "@/lib/calculations/presets";
import { AppSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from "@/lib/storage/settings";
import { Save, RotateCcw, Check } from "lucide-react";

const PRESET_KEYS = Object.keys(PRESET_LABELS) as PresetKey[];
const TIERS: { key: PresetTier; label: string }[] = [
  { key: "conservative", label: "Conservative" },
  { key: "expected", label: "Expected" },
  { key: "best_case", label: "Best case" },
];

const RATE_ROWS: { key: keyof PresetSet["conservative"]; label: string; isCurrency?: boolean }[] = [
  { key: "cpm", label: "CPM", isCurrency: true },
  { key: "clickThroughRate", label: "Click-through rate" },
  { key: "conversionRate", label: "Conversion rate" },
  { key: "leadToBookedCallRate", label: "Lead-to-booked-call rate" },
  { key: "showRate", label: "Show rate" },
  { key: "closeRate", label: "Close rate" },
];

function PresetEditor({ presetKey, value, onChange }: { presetKey: PresetKey; value: Record<PresetTier, PresetSet["conservative"]>; onChange: (v: Record<PresetTier, PresetSet["conservative"]>) => void }) {
  const isDirect = presetKey === "ecommerce";
  const rows = isDirect ? RATE_ROWS.filter((r) => !["leadToBookedCallRate", "showRate", "closeRate"].includes(r.key)) : RATE_ROWS;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Driver</th>
            {TIERS.map((t) => (
              <th key={t.key} className="py-2 pr-4 font-medium">{t.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border/60">
              <td className="py-2 pr-4 text-muted-foreground">{row.label}</td>
              {TIERS.map((t) => {
                const raw = value[t.key][row.key];
                const display = row.isCurrency ? raw : Math.round(raw * 1000) / 10;
                return (
                  <td key={t.key} className="py-2 pr-4">
                    <div className="relative w-28">
                      {row.isCurrency && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>}
                      <Input
                        type="number"
                        step="any"
                        className={row.isCurrency ? "h-8 pl-5 text-sm" : "h-8 pr-6 text-sm"}
                        value={display}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          const stored = row.isCurrency ? num : num / 100;
                          onChange({ ...value, [t.key]: { ...value[t.key], [row.key]: stored } });
                        }}
                      />
                      {!row.isCurrency && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">%</span>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SettingsPage() {
  const [presets, setPresets] = useState<Record<PresetKey, PresetSet> | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPresets(loadScenarioPresets());
    setSettings(loadSettings());
  }, []);

  if (!presets) return <div className="h-64 animate-pulse rounded-lg bg-navy-800" />;

  const handleSaveAll = () => {
    saveScenarioPresets(presets);
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleResetPresets = () => {
    resetScenarioPresets();
    setPresets(DEFAULT_SCENARIO_PRESETS);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Settings &amp; assumptions</h1>
          <p className="text-sm text-muted-foreground">Everything here is stored locally in this browser.</p>
        </div>
        <Button type="button" onClick={handleSaveAll}>
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />} {saved ? "Saved" : "Save changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agency &amp; links</CardTitle>
          <CardDescription>Used for the payment-link and book-onboarding buttons on each audit.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="agencyName">Agency name</Label>
            <Input id="agencyName" value={settings.agencyName} onChange={(e) => setSettings({ ...settings, agencyName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senderName">Your name</Label>
            <Input id="senderName" value={settings.senderName} onChange={(e) => setSettings({ ...settings, senderName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paymentLinkUrl">Payment link URL</Label>
            <Input id="paymentLinkUrl" type="url" placeholder="https://" value={settings.paymentLinkUrl} onChange={(e) => setSettings({ ...settings, paymentLinkUrl: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="onboardingBookingUrl">Onboarding / decision-call booking URL</Label>
            <Input id="onboardingBookingUrl" type="url" placeholder="https://" value={settings.onboardingBookingUrl} onChange={(e) => setSettings({ ...settings, onboardingBookingUrl: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Scenario assumption presets</CardTitle>
            <CardDescription>
              Illustrative planning defaults, not benchmark guarantees. These become the starting point for new
              audits and the &quot;Use preset&quot; buttons in Step 4 — every audit can still override them.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleResetPresets}>
            <RotateCcw className="h-4 w-4" /> Reset to defaults
          </Button>
        </CardHeader>
        <CardContent>
          <Alert tone="info" className="mb-4">
            These are illustrative defaults only. They are not performance guarantees or benchmark promises.
          </Alert>
          <Tabs defaultValue={PRESET_KEYS[0]}>
            <TabsList className="mb-4 flex-wrap">
              {PRESET_KEYS.map((key) => (
                <TabsTrigger key={key} value={key}>{PRESET_LABELS[key]}</TabsTrigger>
              ))}
            </TabsList>
            {PRESET_KEYS.map((key) => (
              <TabsContent key={key} value={key}>
                <PresetEditor
                  presetKey={key}
                  value={presets[key]}
                  onChange={(v) => setPresets({ ...presets, [key]: v })}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
