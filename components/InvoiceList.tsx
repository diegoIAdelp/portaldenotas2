
import React, { useState, useMemo } from 'react';
import { Invoice, UserRole, User, FilterOptions, InvoiceStatus } from '../types';
import { DELP_SECTORS } from '../constants';

interface InvoiceListProps {
  invoices: Invoice[];
  user: User;
  onUpdateInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onEditInvoice?: (invoice: Invoice) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, user, onUpdateInvoice, onDeleteInvoice, onEditInvoice }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    supplierName: '',
    invoiceNumber: '',
    dateFrom: '',
    dateTo: '',
    postDateFrom: '',
    postDateTo: '',
    userName: '',
    sector: user.role === UserRole.ADMIN ? '' : user.sector,
    status: '',
    exportedStatus: 'all',
  });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempObservation, setTempObservation] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [notifyManager, setNotifyManager] = useState(false);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        // Controle de visibilidade por perfil (Privacidade de Setor)
        if (user.role === UserRole.ADMIN) {
          // Acesso total
        } else if (user.role === UserRole.MANAGER) {
          if (inv.userSector !== user.sector) return false;
        } else {
          if (inv.uploadedBy !== user.id) return false;
        }

        // Filtros textuais e status
        const matchSupplier = inv.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase());
        const matchNumber = inv.invoiceNumber.includes(filters.invoiceNumber);
        const matchUser = inv.userName.toLowerCase().includes(filters.userName.toLowerCase());
        const matchStatus = filters.status === '' || inv.status === filters.status;
        
        // Filtro de Setor
        const matchSector = filters.sector === '' || inv.userSector === filters.sector;
        
        // Filtro de Exportação
        let matchExport = true;
        if (filters.exportedStatus === 'yes') matchExport = inv.isExported === true;
        if (filters.exportedStatus === 'no') matchExport = !inv.isExported;

        // Filtro de Data de Emissão
        let matchDate = true;
        if (filters.dateFrom) matchDate = matchDate && inv.emissionDate >= filters.dateFrom;
        if (filters.dateTo) matchDate = matchDate && inv.emissionDate <= filters.dateTo;

        // Filtro de Data de Postagem
        let matchPostDate = true;
        const postDateOnly = inv.createdAt.split('T')[0];
        if (filters.postDateFrom) matchPostDate = matchPostDate && postDateOnly >= filters.postDateFrom;
        if (filters.postDateTo) matchPostDate = matchPostDate && postDateOnly <= filters.postDateTo;

        return matchSupplier && matchNumber && matchUser && matchDate && matchSector && matchPostDate && matchStatus && matchExport;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, user, filters]);

  const handleStatusChange = (invoice: Invoice, newStatus: InvoiceStatus) => {
    if (!onUpdateInvoice) return;
    onUpdateInvoice({ ...invoice, status: newStatus });
  };

  const handleSavePendency = () => {
    if (!editingNoteId || !onUpdateInvoice) return;
    const invoice = invoices.find(i => i.id === editingNoteId);
    
    if (invoice) {
      onUpdateInvoice({ 
        ...invoice, 
        status: InvoiceStatus.PENDENTE, 
        adminObservations: tempObservation,
        managerNotifiedEmail: notifyManager ? managerEmail : undefined
      });

      const subject = `PENDÊNCIA - NF ${invoice.invoiceNumber} - ${invoice.supplierName}`;
      const emailBody = `Prezado(a) ${invoice.userName},\n\nInformamos que a Nota Fiscal mencionada abaixo apresenta uma pendência identificada pela equipe fiscal e precisa de sua atenção.\n\nDETALHES DA NOTA:\nFornecedor: ${invoice.supplierName}\nNúmero da NF: ${invoice.invoiceNumber}\nSetor: ${invoice.userSector}\n\nMOTIVO DA PENDÊNCIA:\n"${tempObservation.toUpperCase()}"\n\nAtenciosamente,\nEquipe Fiscal - Delp`;
      
      const recipient = invoice.userEmail || '';
      const cc = notifyManager ? managerEmail : '';
      const mailtoUrl = `mailto:${recipient}?cc=${cc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      
      window.location.href = mailtoUrl;

      setEditingNoteId(null);
      setTempObservation('');
      setManagerEmail('');
      setNotifyManager(false);
    }
  };

  const handleSingleDownload = (inv: Invoice) => {
    const link = document.createElement('a');
    link.href = inv.pdfUrl;
    link.download = `NOTA_${inv.invoiceNumber}_${inv.supplierName.substring(0,10).toUpperCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (onUpdateInvoice && !inv.isExported) {
      onUpdateInvoice({ ...inv, isExported: true });
    }
  };

  const downloadAllPDFs = () => {
    if (filteredInvoices.length === 0) return alert("Nenhuma nota para baixar.");
    filteredInvoices.forEach((inv, index) => {
      setTimeout(() => handleSingleDownload(inv), index * 500);
    });
  };

  const exportToExcel = () => {
    const headers = ['Status', 'Setor', 'Colaborador', 'Fornecedor', 'Nº Nota', 'Emissão', 'Postagem', 'Valor', 'Exportado'];
    const rows = filteredInvoices.map(inv => [
      inv.status,
      inv.userSector,
      inv.userName,
      inv.supplierName,
      inv.invoiceNumber,
      inv.emissionDate,
      inv.createdAt.split('T')[0],
      inv.value.toFixed(2),
      inv.isExported ? 'SIM' : 'NÃO'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `RELATORIO_NOTAS_${new Date().getTime()}.csv`;
    link.click();
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.RECEBIDA: return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase border border-green-200">Recebida</span>;
      case InvoiceStatus.PENDENTE: return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase border border-red-200 animate-pulse">Pendência</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase border border-slate-200">Em Análise</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* MODAL DE PENDÊNCIA (ADMIN) */}
      {editingNoteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 border border-red-100">
            <div className="p-6 bg-red-600 text-white flex justify-between items-center">
              <h4 className="font-black uppercase text-sm tracking-widest">Apontar Pendência</h4>
              <button onClick={() => setEditingNoteId(null)} className="hover:rotate-90 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Motivo da Pendência</label>
                <textarea 
                  className="w-full h-24 p-4 border-2 border-slate-100 rounded-2xl focus:border-red-500 outline-none transition-all text-sm font-medium bg-slate-50 resize-none"
                  placeholder="Explique o que deve ser corrigido..."
                  value={tempObservation}
                  maxLength={40}
                  onChange={e => setTempObservation(e.target.value)}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    checked={notifyManager}
                    onChange={e => setNotifyManager(e.target.checked)}
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase">Enviar Cópia para Gestor (CC)</span>
                </label>

                {notifyManager && (
                  <input 
                    type="email" 
                    placeholder="E-mail do gestor..."
                    className="w-full px-4 py-3 border-2 border-white rounded-xl text-sm font-bold focus:border-red-500 outline-none transition-all"
                    value={managerEmail}
                    onChange={e => setManagerEmail(e.target.value)}
                  />
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingNoteId(null)} className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all uppercase text-xs">Cancelar</button>
                <button onClick={handleSavePendency} disabled={!tempObservation.trim() || (notifyManager && !managerEmail.includes('@'))} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-50 transition-all uppercase text-xs">Enviar e Abrir Outlook</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS AVANÇADOS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Gerenciador de Notas Fiscais</h3>
            <p className="text-xs text-slate-500 font-medium tracking-tight">Pesquisa avançada e monitoramento de recebíveis.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={downloadAllPDFs} className="flex-1 sm:flex-none bg-slate-800 text-white px-4 py-2.5 rounded-lg text-[11px] font-bold hover:bg-slate-900 transition-all uppercase tracking-tighter">Baixar PDFs</button>
            <button onClick={exportToExcel} className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2.5 rounded-lg text-[11px] font-bold hover:bg-green-700 transition-all uppercase tracking-tighter">Exportar Excel</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-red-500"
              value={filters.status}
              onChange={e => setFilters({...filters, status: e.target.value})}
            >
              <option value="">TODOS OS STATUS</option>
              <option value={InvoiceStatus.RECEBIDA}>RECEBIDA</option>
              <option value={InvoiceStatus.EM_ANALISE}>EM ANÁLISE</option>
              <option value={InvoiceStatus.PENDENTE}>PENDÊNCIA</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Filtrar por Setor</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-red-500 uppercase disabled:bg-slate-50 disabled:text-slate-400"
              value={filters.sector}
              disabled={user.role !== UserRole.ADMIN}
              onChange={e => setFilters({...filters, sector: e.target.value})}
            >
              <option value="">TODOS OS SETORES</option>
              {DELP_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">PDF Exportado?</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-red-500"
              value={filters.exportedStatus}
              onChange={e => setFilters({...filters, exportedStatus: e.target.value})}
            >
              <option value="all">TODOS</option>
              <option value="yes">SIM (EXPORTADOS)</option>
              <option value="no">NÃO EXPORTADOS</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Fornecedor</label>
            <input type="text" placeholder="Pesquisar..." className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.supplierName} onChange={e => setFilters({...filters, supplierName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Período Emissão (Início)</label>
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Período Emissão (Fim)</label>
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Postagem (Início)</label>
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.postDateFrom} onChange={e => setFilters({...filters, postDateFrom: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Postagem (Fim)</label>
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.postDateTo} onChange={e => setFilters({...filters, postDateTo: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Colaborador</label>
            <input type="text" placeholder="Nome..." className="w-full px-3 py-2 border rounded-lg text-sm outline-none" value={filters.userName} onChange={e => setFilters({...filters, userName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nº Nota</label>
            <input type="text" placeholder="000.000" className="w-full px-3 py-2 border rounded-lg text-sm outline-none" value={filters.invoiceNumber} onChange={e => setFilters({...filters, invoiceNumber: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b">
              <tr>
                <th className="px-4 py-4">Status / Detalhes</th>
                <th className="px-4 py-4">Fornecedor</th>
                <th className="px-4 py-4">Colaborador</th>
                <th className="px-4 py-4">Emissão</th>
                <th className="px-4 py-4">Postagem</th>
                <th className="px-4 py-4">Vínculo</th>
                <th className="px-4 py-4 text-right">Valor</th>
                <th className="px-4 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${inv.status === InvoiceStatus.PENDENTE ? 'bg-red-50/20' : ''}`}>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(inv.status)}
                        {inv.isExported && (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100" title="PDF Baixado">
                             <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                             <span className="text-[9px] font-black uppercase">Exportado</span>
                          </div>
                        )}
                      </div>
                      {inv.status === InvoiceStatus.PENDENTE && inv.adminObservations && (
                        <div className="text-[9px] font-black text-red-600 uppercase bg-white border border-red-100 p-2 rounded shadow-sm max-w-[200px] leading-tight italic">
                           OBS: {inv.adminObservations}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{inv.supplierName}</div>
                    <div className="text-[9px] text-slate-400 font-mono">NF: {inv.invoiceNumber}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-[11px] font-bold text-slate-700">{inv.userName}</div>
                    <div className="text-[9px] text-red-600 uppercase font-black">{inv.userSector}</div>
                  </td>
                  <td className="px-4 py-4 text-[10px] font-medium text-slate-600">
                    {inv.emissionDate.split('-').reverse().join('/')}
                  </td>
                  <td className="px-4 py-4 text-[10px] font-bold text-slate-400">
                    {inv.createdAt.split('T')[0].split('-').reverse().join('/')}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase border bg-blue-50 text-blue-600 border-blue-100">
                      {inv.docType} {inv.orderNumber && `- ${inv.orderNumber}`}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs font-black text-slate-900 text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.value)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Visualizar">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </a>
                      
                      <button onClick={() => handleSingleDownload(inv)} className={`p-2 transition-colors ${inv.isExported ? 'text-emerald-500' : 'text-slate-400 hover:text-blue-600'}`} title="Baixar">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>

                      {/* Ações de Workflow (Apenas ADMIN pode mudar status livremente) */}
                      {user.role === UserRole.ADMIN && (
                        <div className="flex space-x-1 border-l pl-2 border-slate-200">
                           <button onClick={() => handleStatusChange(inv, InvoiceStatus.RECEBIDA)} className="p-1.5 text-green-600 hover:bg-green-600 hover:text-white rounded transition-all" title="Marcar Recebida">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                           </button>
                           <button onClick={() => { setEditingNoteId(inv.id); setTempObservation(inv.adminObservations || ''); }} className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded transition-all" title="Apontar Pendência">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                           </button>
                        </div>
                      )}

                      {/* Edição de dados (Admin sempre / User e Manager apenas se NÃO estiver RECEBIDA) */}
                      {(user.role === UserRole.ADMIN || (inv.status !== InvoiceStatus.RECEBIDA)) && onEditInvoice && (
                        <button onClick={() => onEditInvoice(inv)} className="p-1.5 bg-slate-100 text-slate-700 hover:bg-red-600 hover:text-white rounded-lg transition-all" title="Editar / Corrigir">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic text-sm">Nenhum registro encontrado com os critérios selecionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
