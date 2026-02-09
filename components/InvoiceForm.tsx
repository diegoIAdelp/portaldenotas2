
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { analyzeInvoiceImage } from '../services/geminiService';
import { Supplier, ViewType, Invoice, InvoiceStatus } from '../types';
import { UPLOAD_DIRECTORY } from '../constants';

interface InvoiceFormProps {
  onSuccess: (invoice: any) => void;
  onNavigate: (view: ViewType) => void;
  userId: string;
  userName: string;
  userEmail?: string; 
  userSector: string;
  suppliers: Supplier[];
  editData?: Invoice | null;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSuccess, onNavigate, userId, userName, userEmail, userSector, suppliers, editData }) => {
  const [loading, setLoading] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [docType, setDocType] = useState<'OSV' | 'CONTRATO'>('OSV');
  
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierCnpj: '',
    supplierId: '',
    invoiceNumber: '',
    emissionDate: '',
    orderNumber: '',
    value: '',
    observations: '',
  });
  
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editData) {
      setFormData({
        supplierName: editData.supplierName,
        supplierCnpj: editData.supplierCnpj || '',
        supplierId: editData.supplierId || '',
        invoiceNumber: editData.invoiceNumber,
        emissionDate: editData.emissionDate,
        orderNumber: editData.orderNumber || '',
        value: editData.value.toString(),
        observations: editData.observations || '',
      });
      setDocType(editData.docType);
      setSupplierSearch(editData.supplierName);
    }
  }, [editData]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return [];
    const search = supplierSearch.toLowerCase();
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(search) || 
      s.cnpj.includes(search)
    ).slice(0, 5);
  }, [suppliers, supplierSearch]);

  const handleSelectSupplier = (s: Supplier) => {
    setFormData(prev => ({ 
      ...prev, 
      supplierName: s.name, 
      supplierCnpj: s.cnpj, 
      supplierId: s.id 
    }));
    setSupplierSearch(s.name);
    setShowSupplierDropdown(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setLoading(true);
        try {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const data = await analyzeInvoiceImage(base64);
            if (data) {
              setFormData(prev => ({
                ...prev,
                supplierName: data.supplierName || prev.supplierName,
                invoiceNumber: data.invoiceNumber || prev.invoiceNumber,
                emissionDate: data.emissionDate || prev.emissionDate,
                orderNumber: data.orderNumber || prev.orderNumber,
                value: data.value?.toString() || prev.value,
              }));
              setSupplierSearch(data.supplierName || '');
            }
          };
          reader.readAsDataURL(selectedFile);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !editData) return alert('Por favor, selecione um arquivo.');

    const finalFileName = file ? file.name : (editData?.fileName || '');
    const payload = {
      id: editData ? editData.id : Math.random().toString(36).substr(2, 9),
      ...formData,
      docType,
      value: parseFloat(formData.value) || 0,
      // Script interno consome a constante do diretório
      pdfUrl: finalFileName ? `${UPLOAD_DIRECTORY}/${finalFileName}` : '',
      fileName: finalFileName,
      uploadedBy: editData ? editData.uploadedBy : userId,
      userName: editData ? editData.userName : userName,
      userEmail: editData ? editData.userEmail : userEmail,
      userSector: editData ? editData.userSector : userSector,
      createdAt: editData ? editData.createdAt : new Date().toISOString(),
      status: InvoiceStatus.EM_ANALISE,
      adminObservations: editData ? '' : undefined
    };

    onSuccess(payload);
    setFormData({ supplierName: '', supplierCnpj: '', supplierId: '', invoiceNumber: '', emissionDate: '', orderNumber: '', value: '', observations: '' });
    setSupplierSearch('');
    setFile(null);
    setDocType('OSV');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
           <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editData ? 'Corrigir Nota Fiscal' : 'Postar Nota Fiscal'}</h2>
           {editData && <p className="text-[10px] text-red-600 font-bold uppercase mt-0.5 italic">Atenção: verifique a pendência apontada pelo admin</p>}
        </div>
        <div className="text-[10px] font-bold bg-red-600 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-md shadow-red-100">{userSector}</div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-end mb-0.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fornecedor</label>
              <button 
                type="button" 
                onClick={() => onNavigate('suppliers')}
                className="text-[9px] font-black text-red-600 uppercase hover:underline hover:text-red-700 transition-all cursor-pointer"
              >
                + Novo Fornecedor
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none transition-all text-sm font-bold bg-slate-50/50"
                placeholder="Nome ou CNPJ..."
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setFormData(prev => ({ ...prev, supplierName: e.target.value, supplierId: '', supplierCnpj: '' }));
                  setShowSupplierDropdown(true);
                }}
                onFocus={() => setShowSupplierDropdown(true)}
              />
            </div>
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                {filteredSuppliers.map(s => (
                  <button key={s.id} type="button" onClick={() => handleSelectSupplier(s)} className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b last:border-0 border-slate-100">
                    <div className="font-bold text-sm text-slate-800">{s.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{s.cnpj}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Número da Nota Fiscal</label>
            <input type="text" required className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none transition-all text-sm font-bold bg-slate-50/50" placeholder="000.000" value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Emissão</label>
            <input type="date" required className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none transition-all text-sm font-bold bg-slate-50/50" value={formData.emissionDate} onChange={(e) => setFormData({ ...formData, emissionDate: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Total (R$)</label>
            <input type="number" step="0.01" required className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none transition-all text-sm font-black text-red-600 bg-slate-50/50" placeholder="0,00" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Vínculo</label>
            <select className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none transition-all text-sm font-bold bg-slate-50/50" value={docType} onChange={(e) => setDocType(e.target.value as 'OSV' | 'CONTRATO')}>
              <option value="OSV">OSV (Ordem de Serviço/Venda)</option>
              <option value="CONTRATO">CONTRATO / MEDIÇÃO</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Nº Pedido / Contrato (Opcional)</label>
            <input type="text" className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none transition-all text-sm font-bold bg-slate-50/50" placeholder="Ex: 4500000..." value={formData.orderNumber} onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Observações adicionais</label>
          <textarea className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none transition-all text-sm font-medium bg-slate-50/50 h-24 resize-none" placeholder="Informe detalhes importantes sobre esta nota..." value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Documento PDF / Imagem</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${file ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-red-400 hover:bg-red-50'}`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf,image/*" onChange={handleFileChange} />
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-xs font-black text-red-600 uppercase tracking-widest">IA Analisando...</p>
              </div>
            ) : file ? (
              <div className="text-center">
                <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-bold text-slate-800">{file.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Clique para trocar o arquivo</p>
              </div>
            ) : (
              <div className="text-center">
                <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-sm font-bold text-slate-600">Arraste ou clique para selecionar</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">PDF ou Imagem (Análise Automática IA)</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || (!file && !editData)}
            className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all disabled:opacity-50 uppercase text-sm tracking-widest"
          >
            {editData ? 'Salvar Alterações' : 'Postar Nota Fiscal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
