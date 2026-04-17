import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useCasas, useCpaStatus, useDepositos } from "@/hooks/useCpaData";
import { brl, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Trophy, AlertTriangle } from "lucide-react";

export default function ResumoCasasPage() {
  const { data: casas = [] } = useCasas();
  const { data: depositos = [] } = useDepositos();
  const { data: cpa = [] } = useCpaStatus();

  const rows = useMemo(() => {
    return casas.map((c) => {
      const deps = depositos.filter((d) => d.casa_id === c.id);
      const cpas = cpa.filter((x) => x.casa_id === c.id);
      const leadsSet = new Set(deps.map((d) => d.lead_id).concat(cpas.map((x) => x.lead_id)));
      const totalDep = deps.reduce((s, d) => s + d.valor, 0);
      const totalCpa = cpas.filter((x) => x.status === "pago" || x.status === "aprovado").reduce((s, x) => s + x.valor_cpa, 0);
      const lucro = totalCpa - totalDep;
      const roi = totalDep > 0 ? (lucro / totalDep) * 100 : 0;
      return { ...c, leads: leadsSet.size, totalDep, totalCpa, lucro, roi };
    }).sort((a, b) => b.roi - a.roi);
  }, [casas, depositos, cpa]);

  const top = rows[0];
  const worst = [...rows].reverse()[0];

  return (
    <>
      <PageHeader title="Resumo por Casa" subtitle="Comparativo de ROI e performance financeira" />

      {rows.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="glass-card flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-profit/15 text-profit"><Trophy className="h-6 w-6" /></div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Melhor casa</div>
              <div className="text-lg font-semibold">{top?.nome}</div>
              <div className="font-mono text-xs tabular text-profit">ROI {pct(top?.roi ?? 0)} · {brl(top?.lucro ?? 0)}</div>
            </div>
          </div>
          <div className="glass-card flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-loss/15 text-loss"><AlertTriangle className="h-6 w-6" /></div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Pior performance</div>
              <div className="text-lg font-semibold">{worst?.nome}</div>
              <div className="font-mono text-xs tabular text-loss">ROI {pct(worst?.roi ?? 0)} · {brl(worst?.lucro ?? 0)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Casa</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3 text-right">Depositado</th>
                <th className="px-4 py-3 text-right">CPA Gerado</th>
                <th className="px-4 py-3 text-right">Lucro</th>
                <th className="px-4 py-3 text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Nenhuma casa cadastrada.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-surface-2/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.nome}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.tipo}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular">{num(r.leads)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular">{brl(r.totalDep)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular text-profit">{brl(r.totalCpa)}</td>
                  <td className={cn("px-4 py-3 text-right font-mono tabular font-semibold", r.lucro >= 0 ? "text-profit" : "text-loss")}>{brl(r.lucro)}</td>
                  <td className={cn("px-4 py-3 text-right font-mono tabular font-bold", r.roi >= 0 ? "text-profit" : "text-loss")}>{pct(r.roi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
