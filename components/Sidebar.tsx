
import React from 'react';
import { UserRole, User, ViewType } from '../types';
import { APP_NAME, APP_SUBTITLE } from '../constants';
import { DelpIcon } from './Logo';

interface SidebarProps {
  user: User;
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, onNavigate, onLogout }) => {
  const isAdmin = user.role === UserRole.ADMIN;

  const NavItem = ({ view, label, icon }: { view: ViewType, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => onNavigate(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        activeView === view ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen sticky top-0 shadow-2xl z-50">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <DelpIcon className="scale-75 origin-left" />
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">{APP_NAME}</h1>
            <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold leading-tight">{APP_SUBTITLE}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {isAdmin && <NavItem view="dashboard" label="Dashboard" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />}
        
        <NavItem view="invoices" label="Gerenciador de Notas" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
        
        <NavItem view="upload" label="Postar Nota" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>} />
        
        <NavItem view="suppliers" label="Fornecedores" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest">Administração</div>
            <NavItem view="users" label="Usuários" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
            <NavItem view="system" label="Sistema / Backup" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>} />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3 px-2 py-3 bg-slate-800/50 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-red-900/40">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate text-white">{user.name}</p>
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">{user.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-red-600 transition-all group font-bold text-sm"
        >
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span>Sair do Portal</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
