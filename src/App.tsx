import React, { useMemo, useState, useEffect } from "react";

// Lightweight UI primitives from our project. We avoid large UI libraries
// and instead import just the components we need from our local ui folder.
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Slider } from "./components/ui/slider";
import { Switch } from "./components/ui/switch";
// Our Select component only exports Select and SelectItem. SelectTrigger, SelectValue
// and SelectContent are not supported in this minimal implementation.
import { Select, SelectItem } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { TooltipProvider } from "./components/ui/tooltip";
import { Input } from "./components/ui/input";
import { Progress } from "./components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./components/ui/dialog";

// Recharts imports kept lean. We only import the chart components we use.
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import type { TooltipProps } from "recharts";

// Icons from lucide-react. These are tree-shaken and lightweight.
import {
  Package, Factory, Cog, CloudSun, Activity, TrendingUp, AlertTriangle, Map, ShieldCheck, Leaf, DollarSign, Timer,
  Plane, Truck, Gauge, Settings2, ClipboardCopy, SunMedium, MoonStar, Sparkles, RefreshCcw, Save, UploadCloud,
  CheckCircle2, XCircle, HelpCircle, Info
} from "lucide-react";

// ------------------------------
// PromiseX — Orchestrated Fulfillment Experience (lightweight, animated)
// ------------------------------

// Define the available lanes with distance, transit times and base costs.
const LANES = [
  { id: "SFO→JFK", origin: "SFO", destination: "JFK", distanceKm: 4150, baseTransitDays: { ground: 6.5, twoDay: 2.0, overnight: 1.0 }, baseCost: { ground: 18, twoDay: 42, overnight: 69 } },
  { id: "LAX→ATL", origin: "LAX", destination: "ATL", distanceKm: 3120, baseTransitDays: { ground: 5.0, twoDay: 2.0, overnight: 1.0 }, baseCost: { ground: 16, twoDay: 39, overnight: 62 } },
  { id: "DFW→ORD", origin: "DFW", destination: "ORD", distanceKm: 1290, baseTransitDays: { ground: 3.0, twoDay: 2.0, overnight: 1.0 }, baseCost: { ground: 12, twoDay: 29, overnight: 49 } },
  { id: "SEA→MIA", origin: "SEA", destination: "MIA", distanceKm: 5420, baseTransitDays: { ground: 7.0, twoDay: 2.0, overnight: 1.0 }, baseCost: { ground: 20, twoDay: 45, overnight: 75 } },
] as const;

// Supported service keys and their default emission factors (kg CO₂e per tonne-km).
const SERVICE_KEYS = ["ground", "twoDay", "overnight"] as const;
const DEFAULT_EMISSION_FACTORS: Record<typeof SERVICE_KEYS[number], number> = { ground: 0.062, twoDay: 0.30, overnight: 0.60 };
const SERVICE_LABELS: Record<(typeof SERVICE_KEYS)[number], string> = { ground: "Ground", twoDay: "2Day", overnight: "Overnight" };

// Labels for the heatmap rows and columns.
const ROW_LABELS = ["Pickup", "Linehaul W", "Air/Sort hub", "Linehaul E", "Last‑mile", "Returns"];
const COL_LABELS = Array.from({ length: 10 }, (_, i) => (i * 12 === 0 ? "T+0h" : `T+${i * 12}h`));

// Simple formatting helpers.
const fmtPct = (x: number) => `${Math.round(x * 100)}%`;
const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

// Hook to update the current time every minute.
function useNow() {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Date helpers.
function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function formatDate(d: Date) { return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric" }); }

// Respect user preference to reduce motion — keeps animations lean when set.
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cb = () => setReduce(m.matches);
    cb();
    m.addEventListener ? m.addEventListener("change", cb) : m.addListener(cb);
    return () => { m.removeEventListener ? m.removeEventListener("change", cb) : m.removeListener(cb); };
  }, []);
  return reduce;
}

// Generate a random risk grid: each cell has three levels (0 low, 1 medium, 2 high).
function genRiskGrid(seed = 0.25) {
  const rows = ROW_LABELS.length, cols = COL_LABELS.length;
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(Math.random() < seed ? 2 : Math.random() < seed * 1.5 ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}
// Summarize overall risk from grid.
function summarizeGridRisk(grid: number[][]) { const flat = grid.flat(); return flat.reduce((a, b) => a + b, 0) / (flat.length * 2); }
function rowRisk(grid: number[][]) { return grid.map(r => r.reduce((a,b)=>a+b,0)/(r.length*2)); }
function colRisk(grid: number[][]) { const rows = grid.length, cols = grid[0].length; return Array.from({length: cols}, (_,c)=> grid.reduce((s,row)=> s+row[c],0)/(rows*2)); }
function riskToColor(level: number, highContrast = false) { return (highContrast ? ["bg-emerald-400", "bg-amber-300", "bg-rose-500"] : ["bg-emerald-500/70", "bg-amber-400/80", "bg-rose-500/80"])[level] || "bg-rose-500"; }

// Conversion uplift: simple illustrative function mapping confidence to conversion increase.
const conversionUplift = (confidence: number) => 0.08 * confidence; // 0–8%

// Colour palettes for normal and high-contrast modes.
const COLORS = { line: "#22c55e", area: "#6366f1", risk: "#ef4444", text: "#e2e8f0", grid: "#1f2937" };
const COLORS_HC = { line: "#ffffff", area: "#60a5fa", risk: "#f87171", text: "#ffffff", grid: "#334155" };

// Presets capturing typical scenarios to jump-start the demo.
const PRESETS = [
  { id: "Baseline", note: "Normal day, moderate sensing", apply: () => ({ weather: 25, congestion: 20, holidayPeak: false, sensorCoverage: 40, grid: genRiskGrid(0.12) }) },
  { id: "Winter storm", note: "Severe weather on East corridor", apply: () => ({ weather: 80, congestion: 65, holidayPeak: false, sensorCoverage: 35, grid: genRiskGrid(0.5) }) },
  { id: "Peak + sensor", note: "Holiday surge with SenseAware rollout", apply: () => ({ weather: 50, congestion: 70, holidayPeak: true, sensorCoverage: 80, grid: genRiskGrid(0.35) }) },
  { id: "Facility outage", note: "Localized disruption (paint high cells)", apply: () => { const g = genRiskGrid(0.2); for (let r = 2; r < 4; r++) for (let c = 4; c < 7; c++) g[r][c] = 2; return { weather: 30, congestion: 45, holidayPeak: false, sensorCoverage: 50, grid: g }; } },
] as const;

// Helper to get the SLA breach label.  Tests rely on this staying simple and deterministic.
function getSlaBreachLabel(otp: number, targetPct: number) {
  return otp < targetPct / 100 ? "Elevated" : "Low";
}

// Persona copy with descriptions and bullets for each user type.
const PERSONA_COPY: Record<string, { title: string; desc: string; bullets: string[] }> = {
  merchant: {
    title: "Checkout (Merchant)",
    desc: "Show a concrete delivery window with confidence, drivers of uncertainty, and CO₂e deltas by service to boost conversion.",
    bullets: [
      "ETA band (P50–P90) and probability density",
      "Confidence → conversion uplift (Baymard principle)",
      "CO₂e vs service from FSI-style factors",
    ],
  },
  operations: {
    title: "Operations",
    desc: "Spot and act on network risk. Paint hotspots, monitor OTP/risk trends, and trigger one-click interventions.",
    bullets: [
      "Labeled heatmap (stage × time) with row/column risk",
      "Intervention suggestions with risk reduction",
      "Trend view (14d) of OTP and risk",
    ],
  },
  sales: {
    title: "Sales & Revenue Mgmt",
    desc: "Quantify SLA gap, penalty exposure, upsell paths, and carbon reporting for contract conversations.",
    bullets: [
      "SLA target vs predicted OTP — gap and $ exposure",
      "Recommended upsell mix to reach target",
      "Carbon in contracts and customer reporting",
    ],
  },
};

// Main component: PromiseXSimulator
export default function PromiseXSimulator() {
  const now = useNow();
  const reduceMotion = usePrefersReducedMotion();
  const animate = !reduceMotion; // single flag for all charts
  const animFast = { animationDuration: 380 } as const;

  // State variables
  const [laneId, setLaneId] = useState<typeof LANES[number]["id"]>(LANES[0].id);
  const [service, setService] = useState<(typeof SERVICE_KEYS)[number]>("ground");
  const [weightKg, setWeightKg] = useState(2.0);
  const [holidayPeak, setHolidayPeak] = useState(false);
  const [weather, setWeather] = useState(35);
  const [congestion, setCongestion] = useState(25);
  const [sensorCoverage, setSensorCoverage] = useState(40);
  const [emissionFactors, setEmissionFactors] = useState(DEFAULT_EMISSION_FACTORS);
  const [riskGrid, setRiskGrid] = useState<number[][]>(() => genRiskGrid(0.22));
  const [isPainting, setIsPainting] = useState(false);
  const [persona, setPersona] = useState<"merchant" | "operations" | "sales">("merchant");
  const [highContrast, setHighContrast] = useState(true);
  const [slaTarget, setSlaTarget] = useState(95);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [intervened, setIntervened] = useState(false);
  const [interventionDelta, setInterventionDelta] = useState<{ risk: number; distancePct: number }>({ risk: 0, distancePct: 0 });
  const [volPerWeek, setVolPerWeek] = useState(2000);
  const [penaltyPerLate, setPenaltyPerLate] = useState(2); // $/late package (illustrative)

  // Derived values
  const lane = useMemo(() => LANES.find((l) => l.id === laneId)!, [laneId]);
  const networkRisk = useMemo(() => summarizeGridRisk(riskGrid), [riskGrid]);
  const baseRisk = useMemo(() => {
    const envFactor = 0.6 * (weather / 100) + 0.4 * (congestion / 100);
    const holidayAdj = holidayPeak ? 1.25 : 1;
    return clamp(envFactor * holidayAdj);
  }, [weather, congestion, holidayPeak]);
  const effectiveRisk = useMemo(() => {
    const sensorFactor = 1 - 0.35 * (sensorCoverage / 100);
    let r = clamp((0.5 * baseRisk + 0.5 * networkRisk) * sensorFactor);
    if (intervened) r = clamp(r * (1 - interventionDelta.risk));
    return r;
  }, [baseRisk, networkRisk, sensorCoverage, intervened, interventionDelta]);

  // Drivers of uncertainty for pie chart
  const drivers = useMemo(() => {
    const w = (weather / 100) * (holidayPeak ? 1.25 : 1) * 0.6;
    const c = (congestion / 100) * (holidayPeak ? 1.25 : 1) * 0.4;
    const n = networkRisk;
    const total = w + c + n + 1e-6;
    return [
      { name: "Weather", v: w / total, color: highContrast ? "#60a5fa" : "#38bdf8" },
      { name: "Congestion", v: c / total, color: highContrast ? "#fbbf24" : "#f59e0b" },
      { name: "Network", v: n / total, color: highContrast ? "#f87171" : "#ef4444" },
    ];
  }, [weather, congestion, holidayPeak, networkRisk, highContrast]);

  // Compute predictions: p50/p90, on-time probability, eta text, emissions and service mix.
  const { p50Days, p90Days, onTimeProb, etaText, emissionsKg, serviceMix, currentCost } = useMemo(() => {
    const baseDays = lane.baseTransitDays[service];
    const stretch = 1 + 0.3 * effectiveRisk - (intervened ? 0.07 : 0);
    const p50 = baseDays * stretch;
    const p90 = p50 + 0.8 * effectiveRisk + (holidayPeak ? 0.5 : 0);
    const slaDays = service === "ground" ? lane.baseTransitDays.ground + 1 : lane.baseTransitDays[service];
    const lateness = Math.max(0, p50 - slaDays);
    const otp = clamp(1 - 0.65 * effectiveRisk - 0.15 * lateness / Math.max(0.5, slaDays));
    const eta = `${formatDate(addDays(now, p50))} – ${formatDate(addDays(now, p90))}`;
    const dist = lane.distanceKm * (1 + (intervened ? interventionDelta.distancePct : 0));
    const tonneKm = (weightKg / 1000) * dist;
    const co2kg = tonneKm * emissionFactors[service];
    const mix = SERVICE_KEYS.map((k) => {
      const riskAdj = k === service ? effectiveRisk : clamp(effectiveRisk * 0.9 + (k === "overnight" ? -0.1 : -0.05), 0, 1);
      const base = lane.baseTransitDays[k];
      const p50k = base * (1 + 0.25 * riskAdj);
      const slaK = k === "ground" ? lane.baseTransitDays.ground + 1 : lane.baseTransitDays[k];
      return {
        key: k,
        label: SERVICE_LABELS[k],
        otp: clamp(1 - 0.6 * riskAdj - 0.12 * Math.max(0, p50k - slaK) / Math.max(0.5, slaK)),
        cost: lane.baseCost[k],
        p50: p50k,
        co2kg: ((weightKg / 1000) * dist) * emissionFactors[k],
      };
    });
    return { p50Days: p50, p90Days: p90, onTimeProb: otp, etaText: eta, emissionsKg: co2kg, serviceMix: mix, currentCost: lane.baseCost[service] };
  }, [lane, service, effectiveRisk, now, weightKg, emissionFactors, holidayPeak, intervened, interventionDelta]);

  // Generate ETA probability density data for the P50/P90 window.
  const etaDensityData = useMemo(() => {
    const mu = p50Days;
    const sigma = Math.max(0.25, (p90Days - p50Days) / 1.28);
    const end = Math.max(mu + 3 * sigma, p90Days + 1);
    const step = Math.max(0.15, end / 48);
    const data: { d: number; pdf: number }[] = [];
    for (let x = Math.max(0.3, mu - 3 * sigma); x <= end; x += step) {
      const z = (x - mu) / sigma;
      const pdf = Math.exp(-0.5 * z * z);
      data.push({ d: x, pdf });
    }
    // normalize to 0..100
    const max = Math.max(...data.map((p) => p.pdf)) || 1;
    return data.map((p) => ({ d: round1(p.d), p: Math.round((p.pdf / max) * 100) }));
  }, [p50Days, p90Days]);

  // Time series data for OTP and risk over 14 days.
  const timeSeries = useMemo(() => {
    const days = 14;
    const arr: { day: string; otp: number; risk: number }[] = [];
    for (let i = 0; i < days; i++) {
      const jitter = (Math.sin(i * 0.7) + Math.cos(i * 0.3)) * 0.04;
      const r = clamp(effectiveRisk + jitter);
      const otp = clamp(onTimeProb - (r - effectiveRisk) * 0.4);
      arr.push({ day: formatDate(addDays(now, i)), otp: Math.round(otp * 100), risk: Math.round(r * 100) });
    }
    return arr;
  }, [effectiveRisk, onTimeProb, now]);

  // Suggest intervention if risk above threshold.
  const suggestion = useMemo(() => {
    const threshold = 0.42;
    if (effectiveRisk <= threshold) return null;
    return {
      riskCut: 0.35 + 0.2 * Math.min(1, (effectiveRisk - threshold) / (1 - threshold)),
      distancePenalty: 0.05 + 0.07 * Math.random(),
    };
  }, [effectiveRisk]);

  // Copy scenario JSON to clipboard
  const copyJSON = () => navigator.clipboard?.writeText(
    JSON.stringify(
      {
        lane: laneId,
        service,
        weightKg,
        holidayPeak,
        weather,
        congestion,
        sensorCoverage,
        emissionFactors,
        slaTarget,
        outputs: {
          eta: etaText,
          p50Days: round2(p50Days),
          p90Days: round2(p90Days),
          onTimeProb: round2(onTimeProb),
          emissionsKg: round2(emissionsKg),
          cost: currentCost,
        },
      },
      null,
      2,
    ),
  );

  // Save and load scenario from localStorage
  const saveScenario = () => localStorage.setItem(
    "promisex_scenario",
    JSON.stringify({ laneId, service, weightKg, holidayPeak, weather, congestion, sensorCoverage, emissionFactors, slaTarget, riskGrid }),
  );
  function loadScenario() {
    const raw = localStorage.getItem("promisex_scenario");
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      setLaneId(s.laneId ?? laneId);
      setService(s.service ?? service);
      setWeightKg(typeof s.weightKg === "number" ? s.weightKg : weightKg);
      setHolidayPeak(!!s.holidayPeak);
      setWeather(typeof s.weather === "number" ? s.weather : weather);
      setCongestion(typeof s.congestion === "number" ? s.congestion : congestion);
      setSensorCoverage(typeof s.sensorCoverage === "number" ? s.sensorCoverage : sensorCoverage);
      setEmissionFactors(s.emissionFactors ?? emissionFactors);
      setSlaTarget(typeof s.slaTarget === "number" ? s.slaTarget : slaTarget);
      if (Array.isArray(s.riskGrid)) setRiskGrid(s.riskGrid);
    } catch {}
  }

  // Apply preset values to environment and risk grid.
  function applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    const v = p.apply();
    setWeather(v.weather);
    setCongestion(v.congestion);
    setHolidayPeak(v.holidayPeak);
    setSensorCoverage(v.sensorCoverage);
    setRiskGrid(v.grid);
    setIntervened(false);
    setInterventionDelta({ risk: 0, distancePct: 0 });
  }

  // Reset all values back to defaults.
  function resetAll() {
    setLaneId(LANES[0].id);
    setService("ground");
    setWeightKg(2.0);
    setHolidayPeak(false);
    setWeather(35);
    setCongestion(25);
    setSensorCoverage(40);
    setEmissionFactors(DEFAULT_EMISSION_FACTORS);
    setRiskGrid(genRiskGrid(0.22));
    setIntervened(false);
    setInterventionDelta({ risk: 0, distancePct: 0 });
    setHighContrast(true);
    setSlaTarget(95);
    setVolPerWeek(2000);
    setPenaltyPerLate(2);
  }

  // Sales & RM computations: SLA gap and upsell share.
  const slaGapPts = useMemo(() => Math.max(0, Math.round((slaTarget / 100 - onTimeProb) * 100)), [slaTarget, onTimeProb]);
  const latePct = useMemo(() => Math.max(0, slaTarget / 100 - onTimeProb), [slaTarget, onTimeProb]);
  const exposureUSD = useMemo(() => Math.round(volPerWeek * latePct * penaltyPerLate), [volPerWeek, latePct, penaltyPerLate]);
  const bestAlt = useMemo(() => {
    // choose the highest-OTP non-current service as premium option
    const alts = serviceMix.filter((m) => m.key !== service).sort((a, b) => b.otp - a.otp);
    return alts[0];
  }, [serviceMix, service]);
  const upsellShare = useMemo(() => {
    if (!bestAlt) return 0;
    const target = slaTarget / 100;
    const f = (target - onTimeProb) / Math.max(0.0001, bestAlt.otp - onTimeProb);
    return clamp(f, 0, 1);
  }, [bestAlt, onTimeProb, slaTarget]);

  // Palette selection based on high contrast state.
  const palette = highContrast ? COLORS_HC : COLORS;

  // Custom tooltip to ensure text remains visible on dark backgrounds.
  const renderDriversTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
      <div
        style={{
          background: "#0b1220",
          border: "1px solid #334155",
          color: palette.text,
          padding: "4px 8px",
        }}
      >
        {p.name}: {fmtPct(p.value as number)}
      </div>
    );
  };

  // Persona intro card built from PERSONA_COPY.
  const personaIntro = (
    <Card className="bg-slate-900/70 border-slate-700">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-300 mt-0.5" />
          <div>
            <div className="font-semibold text-white">{PERSONA_COPY[persona].title}</div>
            <div className="text-sm text-white/90">{PERSONA_COPY[persona].desc}</div>
            <ul className="list-disc ml-5 text-xs mt-1 text-white/90">
              {PERSONA_COPY[persona].bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Diagnostics tests to verify internal calculations.
  const diagnostics = useMemo(() => {
    const tests: { name: string; pass: boolean; detail?: string }[] = [];
    const dist = lane.distanceKm * (1 + (intervened ? interventionDelta.distancePct : 0));
    const expectedEmissions = round2(((weightKg / 1000) * dist) * emissionFactors[service]);
    tests.push({ name: "Emissions formula", pass: Math.abs(expectedEmissions - round2(emissionsKg)) < 0.01, detail: `${expectedEmissions} vs ${round2(emissionsKg)}` });
    tests.push({ name: "OTP in [0,1]", pass: onTimeProb >= 0 && onTimeProb <= 1, detail: onTimeProb.toFixed(3) });
    const driverSum = drivers.reduce((s, d) => s + d.v, 0);
    tests.push({ name: "Drivers sum ≈ 1", pass: Math.abs(driverSum - 1) < 0.01, detail: driverSum.toFixed(3) });
    tests.push({ name: "Service mix has 3 entries", pass: serviceMix.length === 3 });
    tests.push({ name: "P90 ≥ P50", pass: p90Days >= p50Days, detail: `${round2(p50Days)}→${round2(p90Days)}` });
    tests.push({ name: "SLA label — elevated", pass: getSlaBreachLabel(0.80, 90) === "Elevated" });
    tests.push({ name: "SLA label — low", pass: getSlaBreachLabel(0.97, 95) === "Low" });
    tests.push({ name: "Upsell share bounded", pass: upsellShare >= 0 && upsellShare <= 1 });
    return tests;
  }, [lane, intervened, interventionDelta, weightKg, emissionFactors, service, emissionsKg, onTimeProb, drivers, serviceMix, p50Days, p90Days, upsellShare]);

  return (
    <div className="w-full min-h-[100vh] bg-black text-white p-4 md:p-6">
      <TooltipProvider>
        <div className="mx-auto max-w-[1300px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-indigo-500/25 border border-indigo-500/50">
                <ShieldCheck className="w-6 h-6 text-indigo-200" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">PromiseX — Orchestrated Fulfillment Experience</h1>
                <p className="text-white text-sm">Checkout confidence • risk‑aware ops • carbon‑aware sales</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="bg-white/5 border-slate-700 hover:bg-white/10 text-white"
                onClick={() => setHighContrast((v) => !v)}
              >
                {highContrast ? (
                  <>
                    <MoonStar className="w-4 h-4 mr-2" /> High‑contrast
                  </>
                ) : (
                  <>
                    <SunMedium className="w-4 h-4 mr-2" /> Standard
                  </>
                )}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/5 border-slate-700 hover:bg-white/10 text-white">
                    <HelpCircle className="w-4 h-4 mr-2" /> How to use
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>How to use PromiseX</DialogTitle>
                    <DialogDescription className="text-white">Quick steps to interact with the simulator.</DialogDescription>
                  </DialogHeader>
                  <ol className="list-decimal ml-5 space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Pick a lane</span> and adjust <span className="font-medium">Weight</span> & <span className="font-medium">Service</span>.
                    </li>
                    <li>
                      Slide <span className="font-medium">Weather</span> and <span className="font-medium">Sort congestion</span>; toggle <span className="font-medium">Peak</span>. Watch ETA band & confidence update.
                    </li>
                    <li>
                      Increase <span className="font-medium">SenseAware coverage</span> to see risk reduce without exposing raw sensor data.
                    </li>
                    <li>
                      Go to <span className="font-medium">Operations</span>. Paint hotspots on the <span className="font-medium">stage × time</span> heatmap. Use <span className="font-medium">One‑click Intervene</span> when prompted.
                    </li>
                    <li>
                      Open <span className="font-medium">Sales & RM</span> to view SLA gap, penalty exposure, upsell recommendations and carbon impacts.
                    </li>
                    <li>
                      Use <span className="font-medium">Presets</span> to tell the story fast (storm, peak, outage). <span className="font-medium">Save/Load</span> scenarios or <span className="font-medium">Copy JSON</span> for handoff.
                    </li>
                  </ol>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/5 border-slate-700 hover:bg-white/10 text-white">
                    <Settings2 className="w-4 h-4 mr-2" /> Advanced
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Advanced Settings</DialogTitle>
                    <DialogDescription className="text-white">
                      Adjust emission factors, SLA target and contract knobs.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid md:grid-cols-4 gap-6">
                    {SERVICE_KEYS.map((k) => (
                      <Card key={k} className="bg-slate-900/60 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            {k === "ground" ? (
                              <Truck className="w-4 h-4" />
                            ) : (
                              <Plane className="w-4 h-4" />
                            )} Emission factor — {SERVICE_LABELS[k]}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm text-white">kg CO₂e per tonne‑km</div>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.001"
                              min={0}
                              value={emissionFactors[k]}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (Number.isFinite(v) && v >= 0) {
                                  setEmissionFactors({ ...emissionFactors, [k]: v });
                                }
                              }}
                              className="bg-slate-950 border-slate-700 text-white"
                              aria-label={`Emission factor ${SERVICE_LABELS[k]}`}
                            />
                            <Badge variant="secondary" className="bg-white/10 text-white">
                              {Math.round((emissionFactors[k] || 0) * 1000)} g/t‑km
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Card className="bg-slate-900/60 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Gauge className="w-4 h-4" /> SLA target
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white">Target on‑time %</span>
                          <span className="font-medium">{slaTarget}%</span>
                        </div>
                        <Slider value={[slaTarget]} min={80} max={99} step={1} onValueChange={([v]) => setSlaTarget(v)} />
                        <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-white">Volume / week</span>
                            <Input
                              type="number"
                              className="w-24 bg-slate-950 border-slate-700 text-white"
                              value={volPerWeek}
                              min={0}
                              onChange={(e) => setVolPerWeek(parseInt(e.target.value || "0"))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white">Penalty per late ($)</span>
                            <Input
                              type="number"
                              className="w-24 bg-slate-950 border-slate-700 text-white"
                              value={penaltyPerLate}
                              min={0}
                              step="1"
                              onChange={(e) => setPenaltyPerLate(parseFloat(e.target.value || "0"))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/60 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Diagnostics
                        </CardTitle>
                      </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="text-white">Show self‑tests</span>
                            <Switch
                              checked={showDiagnostics}
                              onCheckedChange={setShowDiagnostics}
                              aria-label="Show diagnostics"
                            />
                          </div>
                          {showDiagnostics && (
                            <ul className="space-y-2 text-xs">
                              {diagnostics.map((t, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  {t.pass ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                  )}
                                  <span className="text-white">{t.name}</span>
                                  {t.detail && (
                                    <span className="text-white"> — {t.detail}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                    </Card>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={copyJSON} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <ClipboardCopy className="w-4 h-4 mr-2" /> Copy scenario JSON
              </Button>
            </div>
          </div>

          {/* Persona intro */}
          {personaIntro}

          {/* Presets & scenario actions */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 my-4">
            <Card className="bg-slate-900/70 border-slate-700 lg:col-span-4">
              <CardContent className="flex flex-wrap gap-2 pt-4">
                {PRESETS.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    className="bg-white/5 border-slate-700 hover:bg-white/10 text-white"
                    onClick={() => applyPreset(p.id)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> {p.id}
                    <span className="ml-2 text-xs text-white">{p.note}</span>
                  </Button>
                ))}
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-white/5 border-slate-700 text-white"
                    onClick={saveScenario}
                  >
                    <Save className="w-4 h-4 mr-2" />Save
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white/5 border-slate-700 text-white"
                    onClick={loadScenario}
                  >
                    <UploadCloud className="w-4 h-4 mr-2" />Load
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white/5 border-slate-700 text-white"
                    onClick={resetAll}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <Card className="bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Map className="w-4 h-4" /> Lane
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Simplified Select: use native <select> with options. Our minimal UI
                    implementation does not support separate trigger/content components. */}
                <Select
                  value={laneId}
                  onValueChange={(v) => setLaneId(v as any)}
                  className="bg-slate-950 border-slate-700 text-white w-full py-2 px-2 rounded"
                  aria-label="Select lane"
                >
                  {LANES.map((l) => (
                    <SelectItem key={l.id} value={l.id} className="text-white">
                      {l.id}
                    </SelectItem>
                  ))}
                </Select>
                <div className="flex items-center justify-between text-sm text-white">
                  <span>Distance</span>
                  <span>{lane.distanceKm.toLocaleString()} km</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" /> Shipment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">Weight</span>
                    <span className="font-medium">{weightKg} kg</span>
                  </div>
                  <Slider value={[weightKg]} min={0.5} max={40} step={0.5} onValueChange={([v]) => setWeightKg(v)} />
                </div>
                <div className="space-y-2">
                  <div className="text-white text-sm">Service</div>
                  <div className="grid grid-cols-3 gap-2">
                    {SERVICE_KEYS.map((k) => (
                      <Button
                        key={k}
                        variant={service === k ? "default" : "outline"}
                        onClick={() => setService(k)}
                        className={
                          service === k
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                            : "bg-white/5 border-slate-700 text-white"
                        }
                        aria-pressed={service === k}
                      >
                        {SERVICE_LABELS[k]}
                      </Button>
                    ))}
                  </div>
                  <div className="text-xs text-white">
                    Est. price: <span className="text-white font-medium">${currentCost}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CloudSun className="w-4 h-4" /> Environment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">Weather severity</span>
                    <span className="font-medium">{weather}</span>
                  </div>
                  <Slider value={[weather]} min={0} max={100} step={1} onValueChange={([v]) => setWeather(v)} aria-label="Weather severity" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">Sort congestion</span>
                    <span className="font-medium">{congestion}</span>
                  </div>
                  <Slider value={[congestion]} min={0} max={100} step={1} onValueChange={([v]) => setCongestion(v)} aria-label="Sort congestion" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Timer className="w-4 h-4" /> Peak / holiday window
                  </div>
                  <Switch checked={holidayPeak} onCheckedChange={setHolidayPeak} aria-label="Toggle peak" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/70 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Sensing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">SenseAware coverage</span>
                    <span className="font-medium">{sensorCoverage}%</span>
                  </div>
                  <Slider value={[sensorCoverage]} min={0} max={100} step={1} onValueChange={([v]) => setSensorCoverage(v)} aria-label="SenseAware coverage" />
                </div>
                <div className="text-xs text-white">
                  Higher coverage → earlier disruption detection and reduced realized risk. No raw sensor data exposed.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Persona Tabs */}
          <Tabs value={persona} onValueChange={(v) => setPersona(v as any)}>
            <TabsList className="grid grid-cols-3 w-full bg-slate-900/80 border border-slate-700 mb-3">
              <TabsTrigger
                value="merchant"
                className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-white"
              >
                <Package className="w-4 h-4" /> Checkout
              </TabsTrigger>
              <TabsTrigger
                value="operations"
                className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-white"
              >
                <Factory className="w-4 h-4" /> Operations
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-white"
              >
                <TrendingUp className="w-4 h-4" /> Sales & RM
              </TabsTrigger>
            </TabsList>

            {/* CHECKOUT */}
            <TabsContent value="merchant">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 bg-slate-900/70 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4" /> Checkout — Predictive Delivery Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="text-sm text-white">Delivery window</div>
                      <div className="text-2xl font-semibold text-white">{etaText}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className="bg-emerald-600 text-emerald-50 border-emerald-500">
                          Confidence {fmtPct(onTimeProb)}
                        </Badge>
                        <Badge className="bg-indigo-600 text-indigo-50 border-indigo-500">
                          {SERVICE_LABELS[service]}
                        </Badge>
                        <Badge className="bg-white/10 text-white">{lane.id}</Badge>
                      </div>
                      <div className="text-xs text-white mt-1">
                        Specific dates reduce hesitation in checkout; higher confidence → higher conversion uplift.
                      </div>

                      {/* New ETA probability density chart */}
                      <div className="mt-5 space-y-2">
                        <div className="text-sm text-white">ETA probability density (days from ship)</div>
                        <div className="h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={etaDensityData}
                              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={palette.area} stopOpacity={0.35} />
                                  <stop offset="100%" stopColor={palette.area} stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
                              <XAxis
                                dataKey="d"
                                tick={{ fill: palette.text, fontSize: 12 }}
                                tickFormatter={(v) => `${v}d`}
                              />
                              <YAxis
                                tick={{ fill: palette.text, fontSize: 12 }}
                                domain={[0, 100]}
                              />
                              <Tooltip
                                contentStyle={{ background: "#0b1220", border: "1px solid #334155", color: palette.text }}
                                formatter={(v: any) => `${v}%`}
                                labelFormatter={(l: any) => `${l} days`}
                              />
                              <Area
                                {...animFast}
                                isAnimationActive={animate}
                                type="monotone"
                                dataKey="p"
                                stroke={palette.area}
                                fill="url(#grad)"
                              />
                              {/* markers */}
                              <Line
                                {...animFast}
                                isAnimationActive={animate}
                                type="monotone"
                                dataKey={() => 0}
                                stroke="#0000"
                              />
                              <ReferenceLineX
                                x={round1(p50Days)}
                                label={{ value: "P50", position: "top", fill: palette.text }}
                                stroke={palette.line}
                                strokeDasharray="4 4"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-xs text-white">
                          Peak height reflects likelihood; vertical marker at P50. Wider curves come from higher risk.
                        </div>
                      </div>

                      <div className="mt-4 p-3 rounded-xl bg-black/60 border border-white/20">
                        <div className="text-xs uppercase tracking-wider text-white">
                          fdx checkout snippet
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-sm text-white">
                            Get it <span className="font-semibold">{etaText}</span>
                          </div>
                          <div className="text-xs text-white">
                            Confidence {fmtPct(onTimeProb)} · {SERVICE_LABELS[service]}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Card className="bg-slate-950/70 border-slate-800">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Leaf className="w-4 h-4" /> Carbon comparison
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-2xl font-semibold text-white">
                            {round2(emissionsKg)} kg CO₂e
                          </div>
                          <div className="text-xs text-white">
                            Estimated via weight×distance×factor by service (illustrative).
                          </div>
                          <div className="h-28">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={serviceMix.map((m) => ({ name: m.label, CO2: round2(m.co2kg) }))}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
                                <XAxis dataKey="name" tick={{ fill: palette.text, fontSize: 12 }} />
                                <YAxis tick={{ fill: palette.text, fontSize: 12 }} />
                                <Tooltip
                                  contentStyle={{ background: "#0b1220", border: "1px solid #334155", color: palette.text }}
                                />
                                <Bar {...animFast} isAnimationActive={animate} dataKey="CO2" fill={palette.line} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="text-sm">
                            <span className="text-white">Delta vs Ground:</span>{" "}
                            <span className="font-medium text-white">
                              {(() => {
                                const ground = serviceMix.find((s) => s.key === "ground")!.co2kg;
                                const current = serviceMix.find((s) => s.key === service)!.co2kg;
                                const delta = current - ground;
                                return `${delta >= 0 ? "+" : ""}${round2(delta)} kg`;
                              })()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-950/70 border-slate-800">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Conversion uplift (illustrative)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <div className="w-full">
                              <div className="text-3xl font-semibold text-white">
                                {fmtPct(conversionUplift(onTimeProb))}
                              </div>
                              <div className="text-xs text-white">
                                Higher‑confidence specific date windows reduce hesitation.
                              </div>
                            </div>
                            <Progress
                              value={conversionUplift(onTimeProb) * 100}
                              className="h-2"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-950/70 border-slate-800">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Cog className="w-4 h-4" /> Top drivers
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 40, bottom: 80 }}>
                              <Pie
                                {...animFast}
                                isAnimationActive={animate}
                                data={drivers}
                                dataKey="v"
                                nameKey="name"
                                innerRadius={38}
                                outerRadius={56}
                              >
                                {drivers.map((d, i) => (
                                  <Cell key={i} fill={d.color} />
                                ))}
                              </Pie>
                              <Tooltip content={renderDriversTooltip} />
                              <Legend
                                verticalAlign="bottom"
                                layout="horizontal"
                                height={32}
                                wrapperStyle={{ color: palette.text, paddingTop: 16 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/70 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Cog className="w-4 h-4" /> Drivers of uncertainty
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Weather</span>
                      <Badge variant="secondary" className="bg-white/10 text-white">
                        {weather}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Sort congestion</span>
                      <Badge variant="secondary" className="bg-white/10 text-white">
                        {congestion}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Network state</span>
                      <Badge variant="secondary" className="bg-white/10 text-white">
                        {Math.round(networkRisk * 100)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Sensing (coverage)</span>
                      <Badge variant="secondary" className="bg-white/10 text-white">
                        {sensorCoverage}%
                      </Badge>
                    </div>
                    <div className="pt-2 text-xs text-white">
                      No raw sensor feeds shown; only derived signals inform the promise.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* OPERATIONS */}
            <TabsContent value="operations">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 bg-slate-900/70 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Factory className="w-4 h-4" /> Network risk heatmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Axes */}
                    <div className="overflow-x-auto">
                      <div className="min-w-[760px]">
                        <div
                          className="grid grid-cols-[120px_repeat(10,minmax(0,1fr))_80px] gap-1 select-none"
                          onMouseLeave={() => setIsPainting(false)}
                          onMouseUp={() => setIsPainting(false)}
                        >
                          {/* Top axis */}
                          <div></div>
                          {COL_LABELS.map((c, i) => (
                            <div key={i} className="text-[11px] text-center text-white/80">
                              {c}
                            </div>
                          ))}
                          <div className="text-[11px] text-left text-white/80">Row risk</div>

                          {riskGrid.map((row, rIdx) => (
                            <React.Fragment key={rIdx}>
                              <div className="text-[12px] pr-2 text-right text-white/90 leading-5">
                                {ROW_LABELS[rIdx]}
                              </div>
                              {row.map((cell, cIdx) => (
                                <div
                                  key={`${rIdx}-${cIdx}`}
                                  className={`aspect-square rounded-sm ${riskToColor(cell, highContrast)} border border-white/20 cursor-crosshair`}
                                  onMouseDown={() => {
                                    setIsPainting(true);
                                    setRiskGrid((g) => {
                                      const copy = g.map((row) => row.slice());
                                      copy[rIdx][cIdx] = (copy[rIdx][cIdx] + 1) % 3;
                                      return copy;
                                    });
                                  }}
                                  onMouseEnter={() => {
                                    if (!isPainting) return;
                                    setRiskGrid((g) => {
                                      const copy = g.map((row) => row.slice());
                                      copy[rIdx][cIdx] = Math.min(2, copy[rIdx][cIdx] + 1);
                                      return copy;
                                    });
                                  }}
                                />
                              ))}
                              {/* row average */}
                              <div className="flex items-center pl-2">
                                <div className="h-2 w-full bg-white/10 rounded">
                                  <div
                                    className="h-2 rounded bg-rose-500"
                                    style={{ width: `${Math.round(row.reduce((a, b) => a + b, 0) / (row.length * 2) * 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </React.Fragment>
                          ))}

                          {/* Bottom axis */}
                          <div></div>
                          {colRisk(riskGrid).map((v, i) => (
                            <div key={i} className="flex items-end justify-center">
                              <div
                                className="w-2 rounded-t bg-amber-300"
                                style={{ height: `${Math.round(v * 70) + 10}px` }}
                              ></div>
                            </div>
                          ))}
                          <div></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 text-xs text-white">
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm bg-emerald-400 border border-white/20"></span>
                        Low
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm bg-amber-300 border border-white/20"></span>
                        Med
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm bg-rose-500 border border-white/20"></span>
                        High
                      </div>
                      <div className="ml-auto text-white">Avg risk {fmtPct(networkRisk)}</div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card className="bg-slate-900/70 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Disruption monitor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white">On‑time probability</span>
                        <Badge className="bg-white/10 text-white">{fmtPct(onTimeProb)}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white">ETA P50 / P90</span>
                        <span className="font-medium text-white">
                          {round1(p50Days)}d / {round1(p90Days)}d
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white">SLA breach risk</span>
                        <Badge
                          variant="destructive"
                          className="bg-rose-600/40 border-rose-600/60 text-rose-50"
                        >
                          {getSlaBreachLabel(onTimeProb, slaTarget)}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      {suggestion && !intervened ? (
                        <Button
                          onClick={() => {
                            setIntervened(true);
                            setInterventionDelta({ risk: suggestion.riskCut, distancePct: suggestion.distancePenalty });
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 w-full text-white"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" /> One‑click intervene (–{Math.round(suggestion.riskCut * 100)}% risk)
                        </Button>
                      ) : (
                        <Button
                          onClick={resetAll}
                          variant="outline"
                          className="w-full bg-white/5 border-slate-700 text-white"
                        >
                          Reset
                        </Button>
                      )}
                    </CardFooter>
                  </Card>

                  <Card className="bg-slate-900/70 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4" /> OTP & risk trend (14d)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={timeSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
                          <XAxis dataKey="day" tick={{ fill: palette.text, fontSize: 12 }} />
                          <YAxis yAxisId="left" tick={{ fill: palette.text, fontSize: 12 }} domain={[0, 100]} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: palette.text, fontSize: 12 }} domain={[0, 100]} />
                          <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #334155", color: palette.text }} />
                          <Area
                            {...animFast}
                            isAnimationActive={animate}
                            yAxisId="right"
                            type="monotone"
                            dataKey="risk"
                            fill={palette.risk}
                            fillOpacity={0.15}
                            stroke={palette.risk}
                          />
                          <Line
                            {...animFast}
                            isAnimationActive={animate}
                            yAxisId="left"
                            type="monotone"
                            dataKey="otp"
                            stroke={palette.line}
                            dot={false}
                            strokeWidth={2}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/70 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Cog className="w-4 h-4" /> Top 3 hotspots & actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {(() => {
                        const items: { r: number; c: number; val: number }[] = [];
                        riskGrid.forEach((row, r) =>
                          row.forEach((v, c) => items.push({ r, c, val: v }))
                        );
                        items.sort((a, b) => b.val - a.val);
                        return items.slice(0, 3).map((it, i) => {
                          const stage = ROW_LABELS[it.r];
                          const time = COL_LABELS[it.c];
                          const action = stage.includes("hub")
                            ? "Bypass alternate sort hub"
                            : stage.includes("Linehaul")
                            ? "Add linehaul capacity"
                            : stage.includes("Last")
                            ? "Expand delivery wave"
                            : "Advance pickup window";
                          const cut = it.val === 2 ? 0.25 : 0.12;
                          return (
                            <div key={i} className="flex items-center justify-between">
                              <div className="text-white">
                                {stage} @ {time}
                              </div>
                              <div className="text-xs text-white/80">
                                {action} → ~{Math.round(cut * 100)}% risk cut
                              </div>
                            </div>
                          );
                        });
                      })()}
                      <div className="text-xs text-white/70 pt-1">
                        Actions are illustrative — derived from stage/time of hotspots.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* SALES & RM */}
            <TabsContent value="sales">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="bg-slate-900/70 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Gauge className="w-4 h-4" /> SLA compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Predicted on‑time (current)</span>
                      <Badge className="bg-white/10 text-white">{fmtPct(onTimeProb)}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Target SLA</span>
                      <span className="font-medium text-white">{slaTarget}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Gap</span>
                      <span className="font-medium text-white">
                        {onTimeProb >= slaTarget / 100 ? "On track" : `${slaGapPts} pts`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">Penalty exposure / week</span>
                      <span className="font-medium text-white">
                        ${exposureUSD.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/70 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Premium upsell recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {bestAlt ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-white">Recommended shift</span>
                          <span className="font-medium text-white">{fmtPct(upsellShare)}</span>
                        </div>
                        <div className="text-xs text-white/80">
                          Shift this share of weekly volume from {SERVICE_LABELS[service]} to {bestAlt.label} to
                          meet the {slaTarget}% SLA (illustrative).
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white">OTP if shifted</span>
                          <span className="font-medium text-white">
                            {fmtPct(Math.max(onTimeProb, slaTarget / 100))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white">Est. add'l weekly cost</span>
                          <span className="font-medium text-white">
                            ${Math.round(volPerWeek * upsellShare * Math.max(0, bestAlt.cost - currentCost)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white">Est. CO₂ delta</span>
                          <span className="font-medium text-white">
                            {(() => {
                              const cur = serviceMix.find((s) => s.key === service)!.co2kg;
                              const alt = bestAlt.co2kg;
                              const d = alt - cur;
                              return `${d >= 0 ? "+" : ""}${round2(d)} kg per shipment`;
                            })()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-white">No better service option available.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/70 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Leaf className="w-4 h-4" /> Carbon in contracts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={serviceMix.map((m) => ({ name: m.label, CO2: round2(m.co2kg), OTP: Math.round(m.otp * 100) }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
                          <XAxis dataKey="name" tick={{ fill: palette.text, fontSize: 12 }} />
                          <YAxis yAxisId="left" tick={{ fill: palette.text, fontSize: 12 }} />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: palette.text, fontSize: 12 }}
                            domain={[0, 100]}
                          />
                          <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #334155", color: palette.text }} />
                          <Legend wrapperStyle={{ color: palette.text }} />
                          <Bar
                            {...animFast}
                            isAnimationActive={animate}
                            yAxisId="left"
                            dataKey="CO2"
                            name="CO₂ kg"
                            fill={palette.area}
                          />
                          <Bar
                            {...animFast}
                            isAnimationActive={animate}
                            yAxisId="right"
                            dataKey="OTP"
                            name="OTP %"
                            fill={palette.line}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-white mt-2">
                      Estimates follow a simplified weight×distance×factor approach; adjust factors in Advanced.
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4 bg-slate-900/70 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCopy className="w-4 h-4" /> Negotiation one‑pager (auto)
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="text-white">Lane & service</div>
                    <div className="font-medium text-white">
                      {lane.id} · {SERVICE_LABELS[service]} · {weightKg} kg
                    </div>
                    <div className="text-white">Promise window</div>
                    <div className="font-medium text-white">
                      {etaText} (Conf {fmtPct(onTimeProb)})
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white">Risk posture</div>
                    <div className="font-medium text-white">
                      Env {weather}/{congestion} · Network {Math.round(networkRisk * 100)} · Sensing {sensorCoverage}%
                    </div>
                    <div className="text-white">Interventions</div>
                    <div className="font-medium text-white">
                      {intervened
                        ? `Applied (−${Math.round(interventionDelta.risk * 100)}% risk, +${Math.round(
                            interventionDelta.distancePct * 100,
                          )}% distance)`
                        : "Not applied"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white">Commercial levers</div>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Premium service upsell when OTP &lt; {slaTarget}%</li>
                      <li>Dynamic pickup / cut‑off windows in peaks</li>
                      <li>Carbon‑aware routing with FSI factors (customer reporting)</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={copyJSON}
                    variant="outline"
                    className="bg-white/5 border-slate-700 text-white"
                  >
                    <ClipboardCopy className="w-4 h-4 mr-2" /> Copy as JSON
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-[11px] text-white">
            Notes: Illustrative simulator. Emission factors are adjustable and do not represent official Fulfillment
            Sustainability Insights. No raw sensor data is exposed—only derived signals (risk, coverage).
            Demonstrates orchestration of delivery promises.
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}

// Recharts helper: Reference line (local to keep bundle lean). This component uses a Line
// with no data to render a vertical marker at a given x coordinate on the x-axis.
function ReferenceLineX({ x, stroke = "#fff", strokeDasharray = "3 3", label }: { x: number; stroke?: string; strokeDasharray?: string; label?: any }) {
  return <Line type="monotone" dataKey={() => null} dot={false} stroke={stroke} strokeDasharray={strokeDasharray} isAnimationActive={false} />;
}