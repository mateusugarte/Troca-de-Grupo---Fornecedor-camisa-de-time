
import React, { useState, useEffect } from 'react';
import { Settings, Search, RefreshCw, CheckCircle, AlertCircle, Link as LinkIcon, Database, Info, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
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
    try {
      const data = await getGroupSettings();
      if (data) setCurrentGroup(data);
      else setError("Tabela vazia no Supabase.");
    } catch (err: any) {
      setError(`Erro Supabase: ${err.message}`);
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

    const result = await fetchGroupInviteInfo(inviteCode);
    setCollectedData(result);

    if (result._debug_error) {
      setError(result._is_network_error 
        ? "Erro de Rede/CORS. A API pode não aceitar chamadas diretas do navegador." 
        : `Erro na API: ${result.message}`);
    } else if (!result.JID) {
      setError("A API respondeu, mas não encontramos o campo 'JID' no resultado.");
    } else {
      showSuccess("ID coletado com sucesso!");
    }
    
    setFetchingApi(false);
  };

  const handleApplyGroup = async () => {
    if (!collectedData?.JID || !currentGroup) return;

    setSaving(true);
    try {
      const updates = {
        group_id: collectedData.JID,
        group_name: collectedData.Name || 'Grupo sem Nome'
      };
      await updateGroupSettings(currentGroup.id, updates);
      setCurrentGroup({ ...currentGroup, ...updates });
      setCollectedData(null);
      setInviteCode('');
      showSuccess("Grupo atualizado!");
    } catch (err: any) {
      setError(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <RefreshCw className="animate-spin text-indigo-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="text-indigo-600 w-5 h-5" />
            <span className="font-bold text-slate-800">Aurea Group Manager</span>
          </div>
          <div className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">Online</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="fixed top-20 right-4 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-right">
            <p className="text-sm font-bold">{success}</p>
          </div>
        )}

        {/* Status Supabase */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Database className="w-3 h-3" /> Grupo Atual (Supabase)
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[9px] font-bold text-indigo-500 uppercase ml-1">ID do Grupo</label>
                <input
                  type="text"
                  readOnly
                  value={currentGroup?.group_id || ''}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-mono text-slate-600"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-indigo-500 uppercase ml-1">Nome do Grupo</label>
                <input
                  type="text"
                  readOnly
                  value={currentGroup?.group_name || ''}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Nova Coleta */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Search className="w-3 h-3" /> Coletar Novo ID
          </h2>
          <form onSubmit={handleCollectId} className="space-y-3">
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Cole o link de convite aqui..."
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-5 py-4 text-sm focus:border-indigo-500 transition-all outline-none"
            />
            <button
              type="submit"
              disabled={fetchingApi}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {fetchingApi ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Coletar ID'}
            </button>
          </form>

          {collectedData && !collectedData._debug_error && (
            <div className="mt-6 p-5 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in zoom-in-95">
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border border-indigo-50">
                  <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">JID Identificado</p>
                  <p className="text-xs font-mono font-bold break-all">{collectedData.JID}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-indigo-50">
                  <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">Nome do Grupo</p>
                  <p className="text-sm font-bold">{collectedData.Name}</p>
                </div>
              </div>
              <button
                onClick={handleApplyGroup}
                disabled={saving}
                className="w-full bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all uppercase text-[10px] tracking-widest"
              >
                {saving ? 'Salvando...' : 'Aplicar ao Supabase'}
              </button>
            </div>
          )}

          {/* Painel de Depuração Visual */}
          {collectedData && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setShowDebug(!showDebug)}
                className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-all uppercase"
              >
                <Terminal className="w-3 h-3" />
                {showDebug ? 'Esconder' : 'Ver'} Resposta Técnica da API
                {showDebug ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              {showDebug && (
                <div className="mt-3 p-4 bg-slate-900 rounded-xl overflow-x-auto">
                  <p className="text-indigo-400 text-[10px] font-mono mb-2">// Requisição efetuada para {inviteCode}</p>
                  <pre className="text-emerald-400 text-[10px] font-mono">
                    {JSON.stringify(collectedData._raw || collectedData, null, 2)}
                  </pre>
                  {collectedData._is_network_error && (
                    <div className="mt-2 text-red-400 text-[10px] font-mono border-t border-slate-700 pt-2">
                      DICA: Se aparecer "Failed to fetch", a API provavelmente bloqueia CORS no navegador.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
