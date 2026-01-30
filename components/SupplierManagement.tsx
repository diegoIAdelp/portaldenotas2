
import React, { useState, useMemo } from 'react';
import { Supplier } from '../types';

interface SupplierManagementProps {
  suppliers: Supplier[];
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
}

const SupplierManagement: React.FC<SupplierManagementProps> = ({ suppliers, onUpdateSuppliers }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier>>({});
  const [search, setSearch] = useState('');
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return suppliers.filter(sup => 
      sup.name.toLowerCase().includes(s) || 
      sup.razaoSocial.toLowerCase().includes(s) || 
      sup.cnpj.includes(s)
    );
  }, [suppliers, search]);

  const handleFetchCnpj = async () => {
    const cnpj = editingSupplier.cnpj?.replace(/\D/g, '');
    if (!cnpj || cnpj.length !== 14) return alert('Digite um CNPJ válido de 14 dígitos.');

    setLoadingCnpj(true);
    try {
      // Usando BrasilAPI (Proxy para Receita Federal)
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!res.ok) throw new Error('Falha ao consultar CNPJ');
      
      const data = await res.json();
      setEditingSupplier(prev => ({
        ...prev,
        name: data.nome_fantasia || data.razao_social,
        razaoSocial: data.razao_social,
        endereco: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.municipio,
        uf: data.uf,
        cep: data.cep,
      }));
    } catch (err) {
      alert('Erro ao consultar Receita Federal. Tente preencher manualmente.');
    } finally {
      setLoadingCnpj(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let updated = [...suppliers];
    if (editingSupplier.id) {
      updated = updated.map(s => s.id === editingSupplier.id ? (editingSupplier as Supplier) : s);
    } else {
      updated.push({
        ...editingSupplier,
        id: Math.random().toString(36).substr(2, 9),
        active: true
      } as Supplier);
    }
    onUpdateSuppliers(updated);
    setIsEditing(false);
    setEditingSupplier({});
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Cadastro de Fornecedores</h3>
            <p className="text-sm text-slate-500">Gerencie a base de dados de parceiros vinculados às notas.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Buscar por Nome ou CNPJ..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button 
              onClick={() => { setEditingSupplier({ cnpj: '', name: '', razaoSocial: '' }); setIsEditing(true); }}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all whitespace-nowrap"
            >
              + Novo Cadastro
            </button>
          </div>
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CNPJ (Apenas números)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required 
                        placeholder="00.000.000/0000-00" 
                        className="flex-1 px-4 py-3 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-red-500" 
                        value={editingSupplier.cnpj} 
                        onChange={e => setEditingSupplier({...editingSupplier, cnpj: e.target.value})} 
                      />
                      <button 
                        type="button" 
                        onClick={handleFetchCnpj}
                        disabled={loadingCnpj}
                        className="bg-slate-800 text-white px-4 rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition-all"
                      >
                        {loadingCnpj ? 'Consultando...' : 'Consultar Receita'}
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome Fantasia</label>
                    <input type="text" required className="w-full px-4 py-3 border rounded-xl text-sm" value={editingSupplier.name} onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Razão Social</label>
                  <input type="text" required className="w-full px-4 py-3 border rounded-xl text-sm" value={editingSupplier.razaoSocial} onChange={e => setEditingSupplier({...editingSupplier, razaoSocial: e.target.value})} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logradouro / Endereço</label>
                    <input type="text" className="w-full px-4 py-3 border rounded-xl text-sm" value={editingSupplier.endereco} onChange={e => setEditingSupplier({...editingSupplier, endereco: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Número</label>
                    <input type="text" className="w-full px-4 py-3 border rounded-xl text-sm" value={editingSupplier.numero} onChange={e => setEditingSupplier({...editingSupplier, numero: e.target.value})} />
                  </div>
                   <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CEP</label>
                    <input type="text" className="w-full px-4 py-3 border rounded-xl text-sm font-mono" value={editingSupplier.cep} onChange={e => setEditingSupplier({...editingSupplier, cep: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bairro</label>
                    <input type="text" className="w-full px-4 py-3 border rounded-xl text-sm" value={editingSupplier.bairro} onChange={e => setEditingSupplier({...editingSupplier, bairro: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cidade</label>
                    <input type="text" className="w-full px-4 py-3 border rounded-xl text-sm" value={editingSupplier.cidade} onChange={e => setEditingSupplier({...editingSupplier, cidade: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">UF</label>
                    <input type="text" maxLength={2} className="w-full px-4 py-3 border rounded-xl text-sm font-bold uppercase" value={editingSupplier.uf} onChange={e => setEditingSupplier({...editingSupplier, uf: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-mail para Contato</label>
                    <input type="email" className="w-full px-4 py-3 border rounded-xl text-sm" value={editingSupplier.contactEmail} onChange={e => setEditingSupplier({...editingSupplier, contactEmail: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all">Gravar Fornecedor</button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.length > 0 ? filtered.map(s => (
                <div key={s.id} className="group p-6 border border-slate-200 rounded-2xl hover:border-red-400 hover:shadow-xl hover:shadow-red-900/5 transition-all bg-white relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <button onClick={() => { setEditingSupplier(s); setIsEditing(true); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-900 line-clamp-1">{s.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">{s.cnpj}</p>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-1 font-medium">{s.razaoSocial}</p>
                  <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase pt-3 border-t border-slate-50">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {s.cidade} - {s.uf}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <p className="text-slate-500 font-medium">Nenhum fornecedor encontrado na base.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierManagement;
