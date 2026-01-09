import React, { useState, useEffect } from 'react';
import { Settings, Search, RefreshCw, CheckCircle, AlertCircle, Link as LinkIcon, Database, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { getGroupSettings, updateGroupSettings } from './services/supabase';
import { fetchGroupInviteInfo } from './services/uazApi';
import { GroupSettings } from './types';

export default function App() {
  const [currentGroup, setCurrentGroup] = useState<GroupSettings | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [collectedData, setCollectedData] = useState<any | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [fetchingApi, setFetchingApi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSupabaseData();
  }, []);

  const loadSupabaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGroupSettings();
      if (data) {
        setCurrentGroup(data);
      } else {
        setError("Não foi possível carregar os dados. Verifique se a tabela 'GRUPO DE SOLICITAÇÃO PARA FORNECEDOR' contém registros.");
      }
    } catch (err: any) {
      setError(`Erro ao conectar com Supabase: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;

    setFetchingApi(true);
    setError(null);
    setCollectedData(null);

    try {
      const result = await fetchGroupInviteInfo(inviteCode);
      setCollectedData(result);

      if (result._debug_error) {
        if (result._is_network_error) {
          setError("Erro de Rede/CORS. A API da UAZAPI pode estar bloqueando chamadas diretas do navegador ou o link é inválido.");
        } else {
          setError(`Erro retornado pela API: ${result.message || 'Desconhecido'}`);
        }
      } else if (!result.JID) {
        setError("A API respondeu com sucesso, mas o ID do grupo (JID) não foi encontrado no JSON recebido.");
      } else {
        showSuccess("Informações do grupo obtidas com sucesso!");
      }
    } catch (err: any) {
      setError(`Erro inesperado ao processar: ${err.message}`);
    } finally {
      setFetchingApi(false);
    }
  };

  const handleApplyGroup = async () => {
    if (!collectedData?.JID || !currentGroup) return;

    setSaving(true);
    setError(null);
    try {
      const updates = {
        group_id: String(collectedData.JID),
        group_name: String(collectedData.Name || 'Grupo sem Nome')
      };
      
      await updateGroupSettings(currentGroup.id, updates);
      
      // Atualiza estado local após sucesso no banco
      setCurrentGroup({ ...currentGroup, ...updates });
      setCollectedData(null);
      setInviteCode('');
      showSuccess("Configurações atualizadas no Supabase!");
    } catch (err: any) {
      setError(`Erro ao salvar no banco de dados: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <RefreshCw className="animate-spin text-indigo-600 w-12 h-12 mb-4" />
      <p className="text-slate-500 font-medium animate-pulse">Sincronizando com Supabase...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 p-5 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Settings className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">Aurea Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live System</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-red-800 text-sm shadow-sm animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
            <div className="space-y-1">
              <p className="font-bold">Atenção</p>
              <p className="leading-relaxed opacity-90">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="fixed top-24 right-4 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right-10 flex items-center gap-3 border border-slate-700">
            <div className="bg-emerald-500/20 p-1.5 rounded-full">
              <CheckCircle className="text-emerald-400 w-5 h-5" />
            </div>
            <p className="text-sm font-semibold">{success}</p>
          </div>
        )}

        {/* Status Supabase */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> Conexão Ativa
            </h2>
            <button onClick={loadSupabaseData} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          
          <div className="space-y-5">
            <div className="group">
              <label className="text-[10px] font-bold text-indigo-500 uppercase ml-1 mb-1.5 block tracking-wide">ID do Grupo Vinculado (JID)</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={currentGroup?.group_id || 'Não disponível'}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-mono text-slate-600 outline-none transition-all group-hover:bg-slate-100/50"
                />
              </div>
            </div>
            <div className="group">
              <label className="text-[10px] font-bold text-indigo-500 uppercase ml-1 mb-1.5 block tracking-wide">Nome do Grupo em Produção</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={currentGroup?.group_name || 'Não disponível'}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-base font-bold text-slate-800 outline-none transition-all group-hover:bg-slate-100/50"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Nova Coleta */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Search className="w-32 h-32" />
          </div>

          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-500" /> Atualizar Automação
          </h2>
          
          <form onSubmit={handleCollectId} className="space-y-4">
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <LinkIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Insira o link ou código de convite do grupo..."
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-14 pr-6 py-5 text-sm focus:border-indigo-500/30 focus:bg-white transition-all outline-none shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={fetchingApi || !inviteCode}
              className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-sm shadow-xl shadow-indigo-100"
            >
              {fetchingApi ? <RefreshCw className="animate-spin w-5 h-5" /> : 'Consultar Informações do Grupo'}
            </button>
          </form>

          {collectedData && !collectedData._debug_error && (
            <div className="mt-8 p-6 bg-indigo-50/40 rounded-[2rem] border-2 border-indigo-100/50 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <CheckCircle className="text-emerald-500 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Grupo Identificado</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Verifique os dados abaixo antes de aplicar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50/50">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2 tracking-wider">Novo JID</p>
                  <p className="text-xs font-mono font-bold break-all text-slate-700 leading-relaxed">{collectedData.JID}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50/50">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2 tracking-wider">Novo Nome</p>
                  <p className="text-base font-extrabold text-slate-800 leading-tight">{collectedData.Name}</p>
                </div>
              </div>

              <button
                onClick={handleApplyGroup}
                disabled={saving}
                className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-[0.98] transition-all uppercase text-[11px] tracking-[0.2em]"
              >
                {saving ? 'Gravando Alterações...' : 'Confirmar e Atualizar Supabase'}
              </button>
            </div>
          )}

          {/* Painel de Depuração Técnica */}
          {collectedData && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <button 
                onClick={() => setShowDebug(!showDebug)}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-tighter"
              >
                <Terminal className="w-3.5 h-3.5" />
                {showDebug ? 'Ocultar' : 'Exibir'} Resposta JSON da API
                {showDebug ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              {showDebug && (
                <div className="mt-4 p-5 bg-slate-900 rounded-2xl overflow-x-auto shadow-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                    <p className="text-indigo-400 text-[9px] font-mono font-bold tracking-widest uppercase tracking-tighter">Debug Console</p>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                    </div>
                  </div>
                  <pre className="text-emerald-400 text-[11px] font-mono leading-relaxed selection:bg-emerald-900 selection:text-emerald-100">
                    {JSON.stringify(collectedData._raw || collectedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-2xl mx-auto px-8 mt-12 pb-8">
        <p className="text-center text-slate-400 text-[10px] font-medium tracking-wide">
          &copy; {new Date().getFullYear()} Aurea Group &bull; Gestão de Identificadores de Automação
        </p>
      </footer>
    </div>
  );
}