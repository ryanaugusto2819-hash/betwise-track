import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useCpaStatus, useDepositos, useLeads, useCasas, usePaineis, useCustos } from "@/hooks/useCpaData";
import { brl, num, pct } from "@/lib/format";
import { Banknote, Coins, Receipt, Trophy, Users, Wallet, TrendingUp, Hourglass, CheckCheck } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";

const chartTooltip = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontSize: 11 },
};

export default function Dashboard() {
  const { data: leads = [] } = useLeads();
  const { data: casas = [] } = useCasas();
  const { data: paineis = [] } = usePaineis();
  const { data: depositos = [] } = useDepositos();
  const { data: cpa = [] } = useCpaStatus();
  const { data: custos = [] } = useCustos();

  const stats = useMemo(() => {
    const cpaPago = cpa.filter((c) => c.status === "pago").reduce((s, c) => s + c.valor_cpa, 0);
    const cpaAprovado = cpa.filter((c) => c.status === "aprovado").reduce((s, c) => s + c.valor_cpa, 0);
    const cpaPendente = cpa.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor_cpa, 0);
    const totalDepositos = depositos.reduce((s, d) => s + d.valor, 0);
    const totalCustos = custos.reduce((s, c) => s + c.valor, 0);
    const investido = totalCustos + depositos.filter((d) => d.origem === "proprio").reduce((s, d) => s + d.valor, 0);
    const receita = cpaPago + cpaAprovado;
    const lucro = receita - investido;
    const roi = investido > 0 ? (lucro / investido) * 100 : 0;
    const leadsAtivos = leads.filter((l) => l.status === "ativo").length;
    return { cpaPago, cpaAprovado, cpaPendente, totalDepositos, investido, receita, lucro, roi, leadsAtivos };
  }, [cpa, depositos, custos, leads]);

  const days = useMemo(() => {
    const start = subDays(new Date(), 13);
    const end = new Date();
    const range = eachDayOfInterval({ start, end });
    return range.map((d) => {
      const key = startOfDay(d).getTime();
      const dayDeposits = depositos
        .filter((dep) => startOfDay(new Date(dep.data_deposito)).getTime() === key)
        .reduce((s, x) => s + x.valor, 0);
      const dayCpa = cpa
        .filter((c) => c.data_pagamento && startOfDay(new Date(c.data_pagamento)).getTime() === key)
        .reduce((s, c) => s + c.valor_cpa, 0);
      return {
        date: format(d, "dd/MM"),
        Receita: dayCpa,
        Depósitos: dayDeposits,
        ROI: dayDeposits > 0 ? ((dayCpa - dayDeposits) / dayDeposits) * 100 : 0,
      };
    });
  }, [depositos, cpa]);

  const perCasa = useMemo(() => {
    return casas.map((c) => {
      const cpas = cpa.filter((x) => x.casa_id === c.id);
      const deps = depositos.filter((x) => x.casa_id === c.id);
      const receita = cpas.filter((x) => x.status === "pago" || x.status === "aprovado").reduce((s, x) => s + x.valor_cpa, 0);
      const invest = deps.reduce((s, x) => s + x.valor, 0);
      const roi = invest > 0 ? ((receita - invest) / invest) * 100 : 0;
      return { nome: c.nome, Receita: receita, Investido: invest, ROI: Number(roi.toFixed(1)) };
    });
  }, [casas, cpa, depositos]);

  const perPainel = useMemo(() => {
    return paineis.map((p) => {
      const cpas = cpa.filter((x) => x.painel_id === p.id);
      const aprovado = cpas.filter((x) => x.status === "aprovado" || x.status === "pago").length;
      return { name: p.nome, value: aprovado, total: cpas.length };
    });
  }, [paineis, cpa]);

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--loss))"];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral da operação CPA em tempo real" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Receita CPA" value={brl(stats.receita)} icon={Banknote} tone="profit" hint={`${num(cpa.length)} registros`} />
        <StatCard label="Total Investido" value={brl(stats.investido)} icon={Wallet} tone="loss" hint={`${num(depositos.length)} depósitos`} />
        <StatCard
          label="Lucro Líquido"
          value={brl(stats.lucro)}
          icon={TrendingUp}
          tone={stats.lucro >= 0 ? "profit" : "loss"}
          hint={`ROI ${pct(stats.roi)}`}
        />
        <StatCard label="Leads Ativos" value={num(stats.leadsAtivos)} icon={Users} tone="info" hint={`${num(leads.length)} no total`} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="CPA Pendente" value={brl(stats.cpaPendente)} icon={Hourglass} tone="warning" />
        <StatCard label="CPA Aprovado" value={brl(stats.cpaAprovado)} icon={CheckCheck} tone="info" />
        <StatCard label="CPA Pago" value={brl(stats.cpaPago)} icon={Trophy} tone="profit" />
        <StatCard label="Depósitos" value={brl(stats.totalDepositos)} icon={Coins} tone="default" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Últimos 14 dias</div>
              <div className="text-lg font-semibold">Receita vs. Depósitos</div>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--profit))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--profit))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-dep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--loss))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--loss))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Receita" stroke="hsl(var(--profit))" strokeWidth={2} fill="url(#g-rev)" />
                <Area type="monotone" dataKey="Depósitos" stroke="hsl(var(--loss))" strokeWidth={2} fill="url(#g-dep)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="mb-4">
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Conversão</div>
            <div className="text-lg font-semibold">Por Painel</div>
          </div>
          <div className="h-[280px]">
            {perPainel.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem dados de painel ainda</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={perPainel} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {perPainel.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-5">
          <div className="mb-4">
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Performance</div>
            <div className="text-lg font-semibold">Por Casa de Aposta</div>
          </div>
          <div className="h-[260px]">
            {perCasa.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Cadastre casas para ver dados</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perCasa}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nome" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Receita" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Investido" fill="hsl(var(--loss))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="mb-4">
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Tendência</div>
            <div className="text-lg font-semibold">ROI Diário (%)</div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="g-roi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip {...chartTooltip} formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Area type="monotone" dataKey="ROI" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#g-roi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {leads.length === 0 && (
        <div className="glass-card mt-6 flex flex-col items-center gap-2 p-10 text-center">
          <Receipt className="h-8 w-8 text-muted-foreground" />
          <div className="text-base font-semibold">Comece cadastrando suas casas, painéis e leads</div>
          <div className="text-sm text-muted-foreground">Os indicadores serão atualizados automaticamente conforme você registra depósitos e CPA.</div>
        </div>
      )}
    </>
  );
}
