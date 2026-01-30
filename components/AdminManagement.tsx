
import React, { useState } from 'react';
import { Invoice, User, UserRole, Supplier, ViewType } from '../types';
import { DELP_SECTORS } from '../constants';

interface AdminManagementProps {
  invoices: Invoice[];
  users: User[];
  suppliers: Supplier[];
  onUpdateUsers: (users: User[]) => void;
  activeView: ViewType;
  onImportData?: (data: any) => void;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ invoices, users, suppliers, onUpdateUsers, activeView, onImportData }) => {
  const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    let newUsers = [...users];
    if (editingUser.id) {
      newUsers = newUsers.map(u => u.id === editingUser.id ? (editingUser as User) : u);
    } else {
      const newUser = { ...editingUser, id: Math.random().toString(36).substr(2, 9) } as User;
      newUsers.push(newUser);
    }
    onUpdateUsers(newUsers);
    setIsEditingUser(false);
    setEditingUser({});
  };

  const exportFullBackup = (format: 'json' | 'csv') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    if (format === 'json') {
      const data = { 
        invoices, 
        users, 
        suppliers, 
        version: '2.0', 
        exportDate: new Date().toISOString(),
        metadata: {
          totalInvoices: invoices.length,
          totalUsers: users.length,
          totalSuppliers: suppliers.length
        }
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `BACKUP_TOTAL_DELP_${timestamp}.json`;
      link.click();
    } else {
      const rows: string[] = [];
      rows.push("TIPO;ID;CAMPO1;CAMPO2;CAMPO3;CAMPO4;CAMPO5;CAMPO6;CAMPO7;CAMPO8;CAMPO9;CAMPO10;CAMPO11;CAMPO12;CAMPO13;CAMPO14;CAMPO15;CAMPO16;CAMPO17;CAMPO18;CAMPO19;CAMPO20");

      users.forEach(u => {
        rows.push(`USUARIO;${u.id};${u.name};${u.email};${u.password || ''};${u.role};${u.sector};${u.notificationEmail || ''};;;;;;;;;;;;;`);
      });

      suppliers.forEach(s => {
        rows.push(`FORNECEDOR;${s.id};${s.name};${s.razaoSocial};${s.cnpj};${s.endereco};${s.numero};${s.complemento};${s.bairro};${s.cidade};${s.uf};${s.cep};${s.contactEmail || ''};${s.active};;;;;;;;`);
      });

      invoices.forEach(i => {
        rows.push(`NOTA;${i.id};${i.supplierId || ''};${i.supplierName};${i.supplierCnpj || ''};${i.invoiceNumber};${i.emissionDate};${i.orderNumber};${i.value};${i.pdfUrl};${i.fileName};${i.uploadedBy};${i.userName};${i.userSector};${i.createdAt};${i.observations || ''};${i.status};${i.adminObservations || ''};${i.managerNotifiedEmail || ''};${i.userResponse || ''};${i.docType}`);
      });

      const fullContent = rows.join('\n');
      const blob = new Blob(['\ufeff' + fullContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `BACKUP_FULL_EXCEL_${timestamp}.csv`;
      link.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          if (data.invoices && data.users && data.suppliers) {
            if (confirm(`Atenção: Este backup JSON contém ${data.invoices.length} notas, ${data.users.length} usuários e ${data.suppliers.length} fornecedores. Deseja SOBREPOR todos os dados atuais por estes?`)) {
              if (onImportData) onImportData(data);
            }
          } else {
            alert("O arquivo JSON não parece ser um backup válido deste sistema.");
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(l => l.trim() !== '');
          const importedInvoices: Invoice[] = [];
          const importedUsers: User[] = [];
          const importedSuppliers: Supplier[] = [];

          lines.slice(1).forEach(line => {
            const p = line.split(';');
            const tipo = p[0];
            
            if (tipo === 'USUARIO') {
              importedUsers.push({ id: p[1], name: p[2], email: p[3], password: p[4], role: p[5] as any, sector: p[6], notificationEmail: p[7] });
            } else if (tipo === 'FORNECEDOR') {
              importedSuppliers.push({ id: p[1], name: p[2], razaoSocial: p[3], cnpj: p[4], endereco: p[5], numero: p[6], complemento: p[7], bairro: p[8], cidade: p[9], uf: p[10], cep: p[11], contactEmail: p[12], active: p[13] === 'true' });
            } else if (tipo === 'NOTA') {
              importedInvoices.push({
                id: p[1], supplierId: p[2], supplierName: p[3], supplierCnpj: p[4], invoiceNumber: p[5],
                emissionDate: p[6], orderNumber: p[7], value: parseFloat(p[8]), pdfUrl: p[9], fileName: p[10],
                uploadedBy: p[11], userName: p[12], userSector: p[13], createdAt: p[14], observations: p[15],
                status: p[16] as any, adminObservations: p[17], managerNotifiedEmail: p[18], userResponse: p[19], docType: p[20] as any
              });
            }
          });

          if (confirm(`Restauração de CSV completa detectada:\n- ${importedUsers.length} Usuários\n- ${importedSuppliers.length} Fornecedores\n- ${importedInvoices.length} Notas\n\nDeseja realizar a SOBREPOSIÇÃO TOTAL da base de dados?`)) {
             if (onImportData) onImportData({ invoices: importedInvoices, users: importedUsers, suppliers: importedSuppliers });
          }
        }
      } catch (err) {
        alert('Erro crítico ao processar restauração. O arquivo pode estar corrompido ou em formato incompatível.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (activeView === 'system') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4 4V4" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Exportação Estruturada</h3>
            <p className="text-sm text-slate-500 max-w-xs">Baixe todos os registros de Notas, Usuários e Fornecedores com todos os campos preenchidos.</p>
            <div className="flex gap-3 w-full pt-4">
              <button onClick={() => exportFullBackup('json')} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-all text-sm uppercase">Backup JSON</button>
              <button onClick={() => exportFullBackup('csv')} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all text-sm uppercase">Backup Excel</button>
            </div>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Restauração de Sistema</h3>
            <p className="text-sm text-slate-500 max-w-xs">Importe um arquivo JSON ou CSV para restaurar a base.</p>
            <div className="w-full pt-4">
              <label className="block w-full cursor-pointer bg-red-600 text-white font-bold py-3 rounded-xl text-center hover:bg-red-700 transition-all text-sm shadow-lg shadow-red-100 uppercase tracking-widest">
                Importar e Restaurar
                <input type="file" className="hidden" accept=".json,.csv" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Gestão de Acessos</h3>
            <p className="text-xs text-slate-500">Controle quem pode postar e gerenciar notas.</p>
          </div>
          <button 
            onClick={() => { setEditingUser({ role: UserRole.USER, sector: DELP_SECTORS[0] }); setIsEditingUser(true); }}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-slate-200 uppercase tracking-tighter"
          >
            + Adicionar Usuário
          </button>
        </div>

        <div className="p-6">
          {isEditingUser ? (
            <form onSubmit={handleSaveUser} className="space-y-6 max-w-2xl mx-auto bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                  <input type="text" required className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-bold" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail de Notificação (Workflow)</label>
                  <input type="email" placeholder="e-mail@delp.com.br" required className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-bold bg-white" value={editingUser.notificationEmail || ''} onChange={e => setEditingUser({...editingUser, notificationEmail: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário de Login</label>
                  <input type="text" required className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-bold" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</label>
                  <input type="text" required className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-bold" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nível de Acesso</label>
                  <select required className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-bold bg-white" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                    <option value={UserRole.USER}>Colaborador</option>
                    <option value={UserRole.MANAGER}>Gestor de Setor</option>
                    <option value={UserRole.ADMIN}>Administrador Master</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Setor Delp</label>
                  <select required className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-bold uppercase bg-white" value={editingUser.sector || ''} onChange={e => setEditingUser({...editingUser, sector: e.target.value})}>
                    {DELP_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsEditingUser(false)} className="px-6 py-3 text-xs font-black text-slate-500 hover:bg-slate-200 rounded-xl transition-all uppercase">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-red-600 text-white rounded-xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all uppercase text-xs">Gravar Usuário</button>
              </div>
            </form>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase text-slate-400 font-bold border-b bg-slate-50/30">
                  <tr>
                    <th className="px-4 py-4">Nome / Setor</th>
                    <th className="px-4 py-4">Login</th>
                    <th className="px-4 py-4">E-mail Notificação</th>
                    <th className="px-4 py-4">Acesso</th>
                    <th className="px-4 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                        <div className="text-[10px] text-red-600 font-black uppercase tracking-tighter">{u.sector}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-medium text-slate-600">{u.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-bold text-slate-700">{u.notificationEmail || '-'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                          u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          u.role === UserRole.MANAGER ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => { setEditingUser(u); setIsEditingUser(true); }} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
