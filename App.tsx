
import React, { useState, useEffect } from 'react';
import { User, UserRole, Invoice, InvoiceStatus, Supplier, ViewType } from './types';
import { DEFAULT_ADMIN, MOCK_STANDARD_USER, APP_NAME, APP_SUBTITLE } from './constants';
import Sidebar from './components/Sidebar';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import AdminDashboard from './components/AdminDashboard';
import AdminManagement from './components/AdminManagement';
import SupplierManagement from './components/SupplierManagement';
import { DelpLogoFull } from './components/Logo';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('upload');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const savedInvoices = localStorage.getItem('noteflow_invoices');
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));

    const savedUsers = localStorage.getItem('noteflow_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const initialUsers = [
        { ...DEFAULT_ADMIN, sector: 'DIRETORIA' },
        { ...MOCK_STANDARD_USER, sector: 'FINANCEIRO' }
      ];
      setUsers(initialUsers);
      localStorage.setItem('noteflow_users', JSON.stringify(initialUsers));
    }

    const savedSuppliers = localStorage.getItem('noteflow_suppliers');
    if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
  }, []);

  const handleSaveInvoice = (invoiceData: any) => {
    let updated;
    const exists = invoices.find(i => i.id === invoiceData.id);
    
    if (exists) {
      updated = invoices.map(i => i.id === invoiceData.id ? { ...invoiceData, status: InvoiceStatus.EM_ANALISE } : i);
      alert('Nota fiscal atualizada com sucesso!');
    } else {
      updated = [{ ...invoiceData, status: InvoiceStatus.EM_ANALISE }, ...invoices];
      alert('Nota fiscal postada com sucesso!');
    }
    
    setInvoices(updated);
    localStorage.setItem('noteflow_invoices', JSON.stringify(updated));
    setEditingInvoice(null);
    setView('invoices');
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    const updated = invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv);
    setInvoices(updated);
    localStorage.setItem('noteflow_invoices', JSON.stringify(updated));
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const updated = invoices.filter(inv => inv.id !== invoiceId);
    setInvoices(updated);
    localStorage.setItem('noteflow_invoices', JSON.stringify(updated));
  };

  const handleEditRequest = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setView('upload');
  };

  const handleUpdateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('noteflow_users', JSON.stringify(newUsers));
  };

  const handleUpdateSuppliers = (newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
    localStorage.setItem('noteflow_suppliers', JSON.stringify(newSuppliers));
  };

  const handleImportFullData = (data: { invoices?: Invoice[], users?: User[], suppliers?: Supplier[] }) => {
    if (data.invoices) {
      setInvoices(data.invoices);
      localStorage.setItem('noteflow_invoices', JSON.stringify(data.invoices));
    }
    if (data.users) {
      setUsers(data.users);
      localStorage.setItem('noteflow_users', JSON.stringify(data.users));
    }
    if (data.suppliers) {
      setSuppliers(data.suppliers);
      localStorage.setItem('noteflow_suppliers', JSON.stringify(data.suppliers));
    }
    alert('Base de dados restaurada com sucesso!');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => 
      (u.email.toLowerCase() === loginIdentifier.toLowerCase() || u.id === loginIdentifier) && 
      u.password === loginPassword
    );

    if (user) {
      setCurrentUser(user);
      setView(user.role === UserRole.ADMIN ? 'dashboard' : 'upload');
    } else {
      alert('Credenciais inválidas.');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="mb-8 animate-in fade-in zoom-in duration-500"><DelpLogoFull className="h-24 scale-125" /></div>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-8 bg-white border-b border-slate-100 text-center">
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{APP_NAME}</h1>
            <p className="text-red-600 text-[10px] font-bold mt-1 tracking-[0.3em] uppercase">{APP_SUBTITLE}</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Usuário ou E-mail</label>
              <input type="text" required className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition-all font-medium" placeholder="Ex: delp" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Sua Senha</label>
              <input type="password" required className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition-all font-medium" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-[0.98] uppercase text-sm tracking-widest">Entrar no Portal</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar user={currentUser} activeView={view} onNavigate={(v) => { setView(v); setEditingInvoice(null); }} onLogout={() => setCurrentUser(null)} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex justify-between items-center">
            <div className="animate-in fade-in slide-in-from-left duration-300">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                {view === 'dashboard' && 'Dashboard Estratégico'}
                {view === 'invoices' && 'Gerenciador de Notas'}
                {view === 'upload' && (editingInvoice ? 'Corrigir Pendência' : 'Postagem de Nota Fiscal')}
                {view === 'suppliers' && 'Base de Fornecedores'}
                {view === 'users' && 'Gestão de Usuários'}
                {view === 'system' && 'Configurações do Sistema'}
              </h2>
              <div className="h-1.5 w-12 bg-red-600 rounded-full mt-2"></div>
            </div>
            <div className="text-right flex items-center space-x-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{currentUser.sector}</span>
            </div>
          </header>

          <div className="animate-in fade-in zoom-in-95 duration-500">
            {view === 'dashboard' && currentUser.role === UserRole.ADMIN && <AdminDashboard invoices={invoices} />}
            {view === 'invoices' && (
              <InvoiceList 
                invoices={invoices} 
                user={currentUser} 
                onUpdateInvoice={handleUpdateInvoice} 
                onDeleteInvoice={handleDeleteInvoice}
                onEditInvoice={handleEditRequest}
              />
            )}
            {view === 'upload' && (
              <InvoiceForm 
                onSuccess={handleSaveInvoice} 
                onNavigate={setView} 
                userId={currentUser.id} 
                userName={currentUser.name}
                userEmail={currentUser.notificationEmail} 
                userSector={currentUser.sector} 
                suppliers={suppliers} 
                editData={editingInvoice}
              />
            )}
            {view === 'suppliers' && <SupplierManagement suppliers={suppliers} onUpdateSuppliers={handleUpdateSuppliers} />}
            {(view === 'users' || view === 'system') && currentUser.role === UserRole.ADMIN && (
              <AdminManagement 
                invoices={invoices} 
                users={users} 
                onUpdateUsers={handleUpdateUsers} 
                suppliers={suppliers}
                activeView={view}
                onImportData={handleImportFullData}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
