"use client";
import { useEffect, useMemo, useState } from "react";
import { CircleAlert, CircleX, Copy, Download, Plus, RotateCcw, Trash2 } from "lucide-react";
import { brakingWorkbench } from "@/lib/workbench/problems/braking";
import { multiDependencyNodes, validateGraph } from "@/lib/workbench/graph";
import { HINT_TIERS, type GraphEdgeType, type GraphNode, type GraphNodeType, type Intervention, type SolutionGraph } from "@/lib/workbench/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NODE_TYPE_META, SolutionGraphView } from "@/components/workbench/SolutionGraphView";
import { TIER_LABEL } from "@/components/workbench/StepCard";
import { ACTION_META } from "@/components/workbench/Verdicts";

const KEY = "mikhyal.authoring.v1";
const SYMBOLS = Object.keys(brakingWorkbench.symbols);
const sel = "h-10 w-full rounded-[10px] border-2 border-line-strong bg-surface px-2 text-sm text-ink";
const EDGE_LABEL: Record<GraphEdgeType, string> = { dependency: "اعتماد", derivation: "اشتقاق", substitution: "تعويض", alternative: "طريق بديل" };

const clone = (g: SolutionGraph): SolutionGraph => JSON.parse(JSON.stringify(g));
const splitList = (s: string) => s.split(/[,،]/).map((x) => x.trim()).filter(Boolean);

export function GraphAuthoring() {
  const [graph, setGraph] = useState<SolutionGraph>(() => clone(brakingWorkbench.graph));
  const [selected, setSelected] = useState<string>("distance_from_time");
  const [newEdge, setNewEdge] = useState<{ from: string; to: string; type: GraphEdgeType }>({ from: "known_u", to: "final_distance", type: "dependency" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setGraph(JSON.parse(raw) as SolutionGraph);
    } catch {
      /* storage unavailable */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(graph));
    } catch {
      /* storage unavailable */
    }
  }, [graph]);

  const issues = useMemo(() => validateGraph(graph, SYMBOLS), [graph]);
  const multi = useMemo(() => multiDependencyNodes(graph), [graph]);
  const node = graph.nodes.find((n) => n.id === selected);
  const ids = graph.nodes.map((n) => n.id);

  const updateNode = (patch: Partial<GraphNode>) => setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === selected ? { ...n, ...patch } : n)) }));
  const renameNode = (to: string) => {
    if (!to || ids.includes(to)) return;
    setGraph((g) => ({
      ...g,
      nodes: g.nodes.map((n) => (n.id === selected ? { ...n, id: to } : n)),
      edges: g.edges.map((e) => ({ ...e, from: e.from === selected ? to : e.from, to: e.to === selected ? to : e.to })),
      paths: g.paths.map((p) => p.map((x) => (x === selected ? to : x))),
    }));
    setSelected(to);
  };
  const addNode = () => {
    let k = graph.nodes.length + 1;
    while (ids.includes(`node_${k}`)) k++;
    const id = `node_${k}`;
    setGraph((g) => ({ ...g, nodes: [...g.nodes, { id, type: "equation_application", label_ar: "عقدة جديدة", requires: [] }] }));
    setSelected(id);
  };
  const removeNode = () => {
    setGraph((g) => ({ ...g, nodes: g.nodes.filter((n) => n.id !== selected), edges: g.edges.filter((e) => e.from !== selected && e.to !== selected), paths: g.paths.map((p) => p.filter((x) => x !== selected)) }));
    setSelected(graph.nodes[0]?.id ?? "");
  };
  const json = JSON.stringify(graph, null, 2);

  return (
    <section className="space-y-4" aria-labelledby="authoring-title" data-authoring>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="authoring-title" className="font-display text-2xl font-extrabold text-ink">
            أداة تأليف جراف الحل
          </h2>
          <p className="max-w-3xl text-sm text-ink-2">
            جراف (مش شجرة قرارات): كميات معلومة، مبادئ، معادلات، تحويلات، قيم وسيطة، قيود، وأهداف — بوصلات اعتماد واشتقاق وتعويض وطرق بديلة. التلميحات والتدخل لكل عقدة. الجراف بيمثل طرق معروفة، والمحرك بيقبل طرق صحيحة غيرها.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={addNode} data-add-node>
            <Plus /> عقدة
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setGraph(clone(brakingWorkbench.graph))}>
            <RotateCcw /> استرجاع الأصل
          </Button>
        </div>
      </div>

      <SolutionGraphView graph={graph} highlight={{ selected, onSelect: setSelected, divergedAt: issues.find((i) => i.code === "cycle")?.nodes[0] }} compact />

      <div className="flex flex-wrap gap-1.5" aria-live="polite" data-issues>
        {issues.length === 0 && <Badge variant="mint" className="whitespace-normal">الجراف سليم: كل المسارات بتوصل للهدف ومافيش دواير</Badge>}
        {issues.map((i, k) => (
          <span key={k} className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-semibold ${i.level === "error" ? "border-destructive/40 bg-danger-soft text-destructive" : "border-amber bg-amber-soft text-amber-dark"}`} data-issue={i.code}>
            {i.level === "error" ? <CircleX className="size-3.5" /> : <CircleAlert className="size-3.5" />}
            {i.message_ar}
          </span>
        ))}
        {multi.length > 0 && <Badge variant="outline" className="whitespace-normal">عقد متعددة الاعتماد: {multi.join("، ")}</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {node && (
          <div className="space-y-3 rounded-[18px] border-2 border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ink">تعديل العقدة</h3>
              <Button size="sm" variant="ghost" onClick={removeNode}>
                <Trash2 /> حذف
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="n-id">المعرّف</Label>
                <Input id="n-id" key={node.id} dir="ltr" defaultValue={node.id} onBlur={(e) => renameNode(e.target.value.trim())} className="h-10 font-latin" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="n-type">النوع</Label>
                <select id="n-type" className={sel} value={node.type} onChange={(e) => updateNode({ type: e.target.value as GraphNodeType })}>
                  {Object.entries(NODE_TYPE_META).map(([k, m]) => (
                    <option key={k} value={k}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="n-label">العنوان</Label>
                <Input id="n-label" value={node.label_ar} onChange={(e) => updateNode({ label_ar: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="n-formula">الصيغة (mathjs، رموز: {SYMBOLS.join(", ")})</Label>
                <Input id="n-formula" dir="ltr" value={node.formula ?? ""} onChange={(e) => updateNode({ formula: e.target.value || undefined })} placeholder="s = u*t + a*t^2/2" className="h-10 font-latin" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="n-req">محتاجة (requires)</Label>
                <Input id="n-req" dir="ltr" value={(node.requires ?? []).join(", ")} onChange={(e) => updateNode({ requires: splitList(e.target.value) })} className="h-10 font-latin" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="n-prod">بتنتج (produces)</Label>
                <Input id="n-prod" dir="ltr" value={(node.produces ?? []).join(", ")} onChange={(e) => updateNode({ produces: splitList(e.target.value) })} className="h-10 font-latin" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="n-int">التدخل عند الخطأ هنا</Label>
                <select id="n-int" className={sel} value={node.intervention ?? "hint"} onChange={(e) => updateNode({ intervention: e.target.value as Intervention })}>
                  {(["hint", "clarify", "experiment", "ai_interpret"] as Intervention[]).map((a) => (
                    <option key={a} value={a}>
                      {ACTION_META[a].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-ink-2">التلميحات المتدرّجة لهذه العقدة</summary>
              <div className="mt-2 space-y-2">
                {HINT_TIERS.map((t) => (
                  <div key={t} className="space-y-1">
                    <Label htmlFor={`h-${t}`}>{TIER_LABEL[t]}</Label>
                    <Textarea id={`h-${t}`} rows={2} value={node.hints?.[t] ?? ""} onChange={(e) => updateNode({ hints: { ...node.hints, [t]: e.target.value } })} />
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        <div className="space-y-3 rounded-[18px] border-2 border-border bg-card p-4">
          <h3 className="font-bold text-ink">الوصلات والمسارات</h3>
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
            {(["from", "to"] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Label htmlFor={`e-${k}`}>{k === "from" ? "من" : "إلى"}</Label>
                <select id={`e-${k}`} className={sel} value={newEdge[k]} onChange={(e) => setNewEdge((x) => ({ ...x, [k]: e.target.value }))} dir="ltr">
                  {ids.map((id) => (
                    <option key={id}>{id}</option>
                  ))}
                </select>
              </div>
            ))}
            <div className="space-y-1">
              <Label htmlFor="e-type">النوع</Label>
              <select id="e-type" className={sel} value={newEdge.type} onChange={(e) => setNewEdge((x) => ({ ...x, type: e.target.value as GraphEdgeType }))}>
                {Object.entries(EDGE_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <Button size="icon-sm" variant="outline" aria-label="أضف وصلة" onClick={() => setGraph((g) => ({ ...g, edges: [...g.edges, newEdge] }))} data-add-edge>
              <Plus />
            </Button>
          </div>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs" dir="ltr">
            {graph.edges.map((e, i) => (
              <li key={i} className="flex items-center gap-2 rounded-[8px] bg-muted px-2 py-1 font-latin">
                <span className="flex-1">
                  {e.from} → {e.to} <span className="text-ink-3">({e.type})</span>
                </span>
                <button type="button" aria-label="احذف الوصلة" onClick={() => setGraph((g) => ({ ...g, edges: g.edges.filter((_, k) => k !== i) }))} className="text-ink-3 hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          {graph.paths.map((p, i) => (
            <div key={i} className="space-y-1">
              <Label htmlFor={`p-${i}`}>المسار {i + 1} (معرّفات بفواصل)</Label>
              <Input id={`p-${i}`} dir="ltr" value={p.join(", ")} onChange={(e) => setGraph((g) => ({ ...g, paths: g.paths.map((x, k) => (k === i ? splitList(e.target.value) : x)) }))} className="h-10 font-latin text-xs" />
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setGraph((g) => ({ ...g, paths: [...g.paths, []] }))}>
            <Plus /> مسار بديل
          </Button>
        </div>
      </div>

      <details className="rounded-[18px] border-2 border-border bg-card p-4">
        <summary className="cursor-pointer font-bold text-ink">تصدير JSON</summary>
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(json);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                /* clipboard unavailable */
              }
            }}
          >
            <Copy /> {copied ? "اتنسخ" : "انسخ"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${graph.problem_id}.graph.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download /> نزّل
          </Button>
        </div>
        <pre dir="ltr" className="mt-2 max-h-80 overflow-auto rounded-[10px] bg-ink p-3 text-start font-latin text-xs text-white">
          {json}
        </pre>
      </details>
    </section>
  );
}
