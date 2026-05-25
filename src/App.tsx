import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProventosAposentadoria from './components/ProventosAposentadoria';
import RegrasAposentadoria from './components/RegrasAposentadoria';
import AtualizacaoContribuicoes from './components/AtualizacaoContribuicoes';
import GratificacaoEspecial from './components/GratificacaoEspecial';
import SimulacaoCompleta from './components/SimulacaoCompleta';
import SimulacoesSalvas from './components/SimulacoesSalvas';
import Cadastros from './components/Cadastros';
import { Scale, CheckCircle2, Menu } from 'lucide-react';
import { initMigration } from './utils/simulationsStore';
import { loadSettingsFromServer } from './utils/settingsStore';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    Promise.all([
      initMigration(),
      loadSettingsFromServer()
    ]).then(() => setAppReady(true));
  }, []);

  if (!appReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6]">
        <div className="text-[#004b8d] font-bold animate-pulse text-sm">Carregando sistema DGEP...</div>
      </div>
    );
  }

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tabId) => setActiveTab(tabId)} />;
      case 'proventos':
        return <ProventosAposentadoria />;
      case 'regras':
        return <RegrasAposentadoria />;
      case 'atualizacao':
        return <AtualizacaoContribuicoes />;
      case 'gratificacao':
        return <GratificacaoEspecial />;
      case 'simulacao_completa':
        return <SimulacaoCompleta />;
      case 'simulacoes_salvas':
        return <SimulacoesSalvas onNavigate={(tabId) => setActiveTab(tabId)} />;
      case 'cadastros':
        return <Cadastros />;
      default:
        return <Dashboard onNavigate={(tabId) => setActiveTab(tabId)} />;
    }
  };

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Início';
      case 'proventos':
        return 'Cálculo de Proventos de Aposentadoria';
      case 'regras':
        return 'Elegibilidade de Regras IPMC';
      case 'atualizacao':
        return 'Atualização Monetária de Contribuições';
      case 'gratificacao':
        return 'Simulador de Gratificação Especial';
      case 'simulacao_completa':
        return 'Simulação Completa';
      case 'simulacoes_salvas':
        return 'Simulações Salvas';
      case 'cadastros':
        return 'Gestão de Tabelas Remuneratórias de Cargos e FGs';
      default:
        return 'Painel de Controle';
    }
  };

  return (
    <div className="flex bg-[#f4f7f6] min-h-screen text-[#212529] font-sans antialiased selection:bg-[#004b8d]/10">
      {/* Retractable Sidebar Menu */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main viewport area - offset for fixed sidebar width transition */}
      <div className="flex-1 flex flex-col pl-0 md:pl-64 transition-all duration-300 min-h-screen print:pl-0">
        
        {/* Dynamic Header Panel */}
        <header className="bg-white border-b border-[#dee2e6] py-4.5 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-1 -ml-1 text-gray-500 hover:bg-gray-100 rounded-md md:hidden flex-shrink-0 cursor-pointer"
            >
              <Menu size={24} />
            </button>
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                DGEP — Diretoria de Gestão de Pessoas
              </span>
              <h2 className="text-sm font-bold text-gray-800 leading-none">
                {getBreadcrumb()}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-gray-400 font-semibold block leading-none">
                Data do Sistema
              </span>
              <strong className="text-xs font-bold text-gray-700 block mt-0.5 select-none">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </strong>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse outline outline-3 outline-emerald-500/20" title="Online" />
          </div>
        </header>

        {/* Dynamic section wrapper container */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden print:p-0">
          <div className="animate-fade-in duration-200">
            {renderActiveSection()}
          </div>
        </main>
        
        {/* Global Footer */}
        <footer className="py-6 px-8 border-t border-[#dee2e6] text-center text-xs text-gray-400 print:hidden select-none">
          Portal Integrado DGEP / IPMC — Versão 3.12 • Câmara Municipal de Curitiba
        </footer>
      </div>
    </div>
  );
}
