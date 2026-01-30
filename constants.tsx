
import React from 'react';

export const APP_NAME = "Portal de notas";
export const APP_SUBTITLE = "Portal corporativo de notas Delp";

export const DEFAULT_ADMIN: any = { 
  id: 'admin-master', 
  name: 'Administrador Master', 
  email: 'delp', 
  notificationEmail: 'admin@delp.com.br',
  password: 'delp1234', 
  role: 'ADMIN' 
};

export const MOCK_STANDARD_USER: any = { 
  id: 'user-1', 
  name: 'Colaborador Delp', 
  email: 'usuario@delp.com.br', 
  notificationEmail: 'colaborador@delp.com.br',
  password: '123',
  role: 'USER' 
};

export const COLORS = {
  primary: '#dc2626', // Red 600
  secondary: '#64748b',
  success: '#22c55e',
  danger: '#ef4444',
};

export const DELP_SECTORS = [
  "Acabamento/Pintura",
  "Almoxarifado",
  "Apoio Usinagem e Montagem Mecânica",
  "Centro Tecnológico de Soldagem - CTS",
  "Comercial",
  "Controle de Qualidade",
  "Delp Açu",
  "Diretoria",
  "Excelência Operacional",
  "Facilities",
  "Field Service",
  "Financeiro",
  "Gente & Gestão",
  "Gerencia da Produção",
  "Gerencia de Projetos",
  "Logística",
  "Manutenção e Expansão",
  "Marketing",
  "Montagem Externa Geral",
  "Montagem Mecânica",
  "Pesquisa e Desenvolvimento – P&D",
  "Planejamento PCP",
  "Pré-Montagem",
  "Preparação",
  "Serviço Espec. Eng. Seg. Medicina Trabalho - SESMT",
  "Sistema Garantia Qualidade",
  "Solda Convencional",
  "Suprimentos",
  "Tecnologia da Informação",
  "Usinagem Mecânica Pesada"
];
