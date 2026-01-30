
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Invoice, InvoiceStatus } from '../types';
import { generateAdminSummary } from '../services/geminiService';

interface AdminDashboardProps {
  invoices: Invoice[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ invoices }) => {
  const [summary, setSummary] = useState<string>('Gerando análise financeira inteligente...');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filtragem dos dados baseada nas datas de postagem (createdAt)
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const postDate = inv.createdAt.split('T')[0];
      let match = true;
      if (startDate) match = match && postDate >= startDate;
      if (endDate) match = match && postDate <= endDate;
      return match;
    });
  }, [invoices, startDate, endDate]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (filteredInvoices.length > 0) {
        setSummary('Gerando análise financeira inteligente baseada no período...');
        const text = await generateAdminSummary(filteredInvoices);
        setSummary(text || "Sem dados suficientes para análise.");
      } else {
        setSummary("Nenhuma nota fiscal encontrada para o período selecionado.");
      }
    };
    fetchSummary();
  }, [filteredInvoices]);

  // Agrupamento por Fornecedor
  const supplierData = Object.values(
    filteredInvoices.reduce((acc: any, inv) => {
      if (!acc[inv.supplierName]) {
        acc[inv.supplierName] = { name: inv.supplierName, totalValue: 0 };
      }
      acc[inv.supplierName].totalValue += (inv.value || 0);
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.totalValue - a.totalValue).slice(0, 10);

  // Agrupamento por Colaborador (Novo)
  const userData = Object.values(
    filteredInvoices.reduce((acc: any, inv) => {
      if (!acc[inv.userName]) {
        acc[inv.userName] = { name: inv.userName, totalValue: 0 };
      }
      acc[inv.userName].totalValue += (inv.value || 0);
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.totalValue - a.totalValue).slice(0, 5);

  const totalValue = filteredInvoices.reduce((sum, inv) => sum + (inv.value || 0), 0);
  
  // Contadores de Status
  const statusCounts = {
    recebidas: filteredInvoices.filter(i => i.status === InvoiceStatus.RECEBIDA).length,
    analise: filteredInvoices.filter(i => i.status === InvoiceStatus.EM_ANALISE).length,
    pendentes: filteredInvoices.filter(i => i.status === InvoiceStatus.PENDENTE).length,
  };

  const mainStats = [
    { label: 'Investimento Total', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue), color: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200' },
    { label: 'Notas Recebidas', value: statusCounts.recebidas, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { label: 'Em Análise', value: statusCounts.analise, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Pendentes', value: statusCounts.pendentes, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* SEÇÃO DE FILTROS DE DATA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-1">Período de Postagem</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Filtre os resultados do dashboard por data de upload</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
             <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Início</label>
             <input 
               type="date" 
               className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:border-red-500 outline-none transition-all"
               value={startDate}
               onChange={e => setStartDate(e.target.value)}
             />
          </div>
          <div className="flex-1 md:flex-none">
             <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Fim</label>
             <input 
               type="date" 
               className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:border-red-500 outline-none transition-all"
               value={endDate}
               onChange={e => setEndDate(e.target.value)}
             />
          </div>
          <button 
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="mt-4 md:mt-0 px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all self-end"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* CARTÕES DE ESTATÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, i) => (
          <div key={i} className={`${stat.bg} ${stat.border} border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
            <div className={`absolute -right-2 -bottom-2 w-12 h-12 opacity-5 group-hover:scale-150 transition-transform`}>
               <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
            </div>
          </div>
        ))}
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Fornecedores */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Maiores Investimentos</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Top 10 Fornecedores por Volume Financeiro</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
               <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} width={100} />
                <Tooltip 
                   formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="totalValue" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20}>
                  {supplierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#dc2626', '#ef4444', '#f87171', '#ef4444', '#dc2626'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Colaboradores (Novo) */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Volume por Colaborador</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ranking de postagem por valor financeiro</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
               <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userData} margin={{ top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                   formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="totalValue" fill="#475569" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* IA INSIGHTS */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50 animate-pulse">
               <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">IA Financial Analysis (Gemini)</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Insights inteligentes baseados no período selecionado</p>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50">
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed italic">
              {summary}
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between">
             <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase">
               <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Análise dinâmica gerada em tempo real
             </div>
             <div className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
               DELP INTELLIGENCE
             </div>
          </div>
        </div>
        
        {/* Decoração Background IA */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
      </div>
    </div>
  );
};

export default AdminDashboard;
