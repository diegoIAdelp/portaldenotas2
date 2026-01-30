
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { analyzeInvoiceImage } from '../services/geminiService';
import { Supplier, ViewType, Invoice, InvoiceStatus } from '../types';

interface InvoiceFormProps {
  onSuccess: (invoice: any) => void;
  onNavigate: (view: ViewType) => void;
  userId: string;
  userName: string;
  userEmail?: string; // Prop adicionada para vínculo
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

    const payload = {
      id: editData ? editData.id : Math.random().toString(36).substr(2, 9),
      ...formData,
      docType,
      value: parseFloat(formData.value) || 0,
      pdfUrl: file ? URL.createObjectURL(file) : (editData?.pdfUrl || ''),
      fileName: file ? file.name : (editData?.fileName || ''),
      uploadedBy: editData ? editData.uploadedBy : userId,
      userName: editData ? editData.userName : userName,
      userEmail: editData ? editData.userEmail : userEmail, // Gravando e-mail de notificação
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

          <div className="space-y-3 col-span-1 md:col-span-2 bg-slate-50 p-5 rounded-2xl border-2 border-slate-100">
            <div className="flex items-center space-x-6 mb-1">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Vínculo:</label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="radio" checked={docType === 'OSV'} onChange={() => setDocType('OSV')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-red-600 transition-colors uppercase">OSV</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="radio" checked={docType === 'CONTRATO'} onChange={() => setDocType('CONTRATO')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-red-600 transition-colors uppercase">CONTRATO</span>
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <input 
                type="text" 
                required={docType === 'OSV'}
                className="w-full px-4 py-3 border-2 border-white rounded-xl focus:border-red-500 outline-none transition-all text-sm font-bold" 
                placeholder={docType === 'OSV' ? "Número da Ordem de Serviço (Obrigatório)" : "OS / Contrato (Opcional)"} 
                value={formData.orderNumber} 
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })} 
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Observações</label>
          <textarea className="w-full px-4 py-2 border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none transition-all min-h-[60px] text-sm font-medium bg-slate-50/30" placeholder="Informações adicionais..." value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Anexo</label>
          <div onClick={() => fileInputRef.current?.click()} className={`border-3 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-red-400 hover:bg-slate-50'}`}>
            {loading ? (
              <div className="flex flex-col items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-2"></div><p className="text-[10px] font-bold text-slate-600 uppercase">Processando...</p></div>
            ) : file ? (
              <div className="text-center"><div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mx-auto mb-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div><p className="text-[11px] font-black text-slate-900 uppercase truncate max-w-[200px]">{file.name}</p></div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase">PDF ou Imagem da Nota</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,image/*" />
          </div>
        </div>

        <div className="flex gap-4 pt-2">
           <button type="submit" className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all active:scale-95 uppercase text-[11px] tracking-widest">
             Confirmar Postagem
           </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
