import { useState, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams
} from 'react-router-dom'
import {
  History,
  Settings,
  Bell,
  MonitorPlay,
  ArrowRight,
  Menu,
  ChevronLeft,
  ExternalLink,
  Activity,
  Maximize2,
  Pencil,
  Trash,
  Clock,
  Target,
  CheckCircle,
  X,
  Eye,
  Database
} from 'lucide-react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

// --- CONFIG ---
const queryClient = new QueryClient()
const API_URL = 'http://localhost:3000/api'

// Utilitária global para lidar com JSONB do banco de dados
const ensureArray = (rules: any) => {
  if (!rules) return []
  if (Array.isArray(rules)) return rules
  try {
    if (typeof rules === 'string') return JSON.parse(rules)
  } catch (e) {
    console.error('Erro ao converter regras:', e)
  }
  return []
}

// --- COMPONENTES UI COMPACTOS ---

const Badge = ({ children, color = "blue" }: any) => {
  const colors: any = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    zinc: "bg-zinc-800 text-zinc-400 border-zinc-700",
  }
  return (
    <span className={`px-1.5 py-0.5 rounded-sm border text-[10px] font-bold ${colors[color]}`}>
      {children}
    </span>
  )
}

const PressureBar = ({ label, home, away }: any) => {
  const h = Number(home || 0)
  const a = Number(away || 0)
  const total = h + a
  const homePercent = total > 0 ? (h / total) * 100 : 50

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-[9px] font-black tracking-widest px-0.5">
        <span className={h >= a ? 'text-blue-400 font-black scale-110 transition-transform' : 'text-zinc-500'}>{h}</span>
        <span className="text-zinc-600 uppercase text-[8px]">{label}</span>
        <span className={a > h ? 'text-red-500 font-black scale-110 transition-transform' : 'text-zinc-500'}>{a}</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-900/50 rounded-full overflow-hidden flex relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
        {/* Barra Casa */}
        <div
          className="h-full bg-blue-700 transition-all duration-700 ease-out relative"
          style={{ width: `${homePercent}%` }}
        >
          {h > a && (
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-blue-400/30 to-transparent blur-sm"></div>
          )}
        </div>
        {/* Divisor Central */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 z-10 shadow-sm"></div>
        {/* Barra Visitante */}
        <div
          className="h-full bg-red-800 transition-all duration-700 ease-out relative"
          style={{ width: `${100 - homePercent}%` }}
        >
          {a > h && (
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-red-500/20 to-transparent blur-sm"></div>
          )}
        </div>
      </div>
    </div>
  )
}

const OddsBox = ({ label, pre, live, highlight = false, color = "blue" }: any) => {
  const activeColor = color === "red" ? "text-red-500" : color === "emerald" ? "text-emerald-400" : "text-blue-400";
  const activeLetter = color === "red" ? "text-red-600" : color === "emerald" ? "text-emerald-500" : "text-blue-500";
  const activeBg = color === "red" ? "bg-red-900/20 border-red-800/40" : color === "emerald" ? "bg-emerald-600/10 border-emerald-500/30" : "bg-blue-600/10 border-blue-500/30";

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      {label && <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>}
      <div className={`w-full h-[40px] flex flex-col items-center justify-center rounded-sm border ${highlight ? activeBg : 'bg-zinc-900/50 border-zinc-800'
        }`}>
        <div className="flex items-center justify-center gap-1 leading-none mb-0.5 ml-[-4px]">
          <span className="w-2.5 text-[7px] text-zinc-600 font-black text-center">P</span>
          <span className="text-[9px] text-zinc-500 font-medium tabular-nums">{pre ?? '-'}</span>
        </div>
        <div className="flex items-center justify-center gap-1 leading-none ml-[-4px]">
          <span className={`w-2.5 text-[7px] font-black text-center ${highlight ? activeLetter : 'text-zinc-600'}`}>L</span>
          <span className={`text-[12px] font-black tabular-nums ${highlight ? activeColor : 'text-zinc-100'}`}>
            {live ?? '-'}
          </span>
        </div>
      </div>
    </div>
  )
}

const HeaderLabel = ({ children, tooltip, className = "" }: any) => (
  <div title={tooltip} className={`relative group text-[9px] text-zinc-500 uppercase font-black tracking-tighter flex items-center justify-center text-center cursor-help ${className}`}>
    {children}
    {tooltip && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[9999] pointer-events-none">
        <div className="bg-zinc-800 text-white text-[11px] px-3 py-2 rounded-md border border-zinc-600 shadow-2xl whitespace-nowrap normal-case font-bold min-w-max relative">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-800"></div>
        </div>
      </div>
    )}
  </div>
)

const StatColumnCell = ({ value, subValue, highlight = false }: any) => (
  <div className="flex flex-col items-center justify-center min-w-[36px] flex-1 border-r border-zinc-800/30 h-full py-0.5">
    <span className={`text-[12px] font-mono tabular-nums ${highlight ? 'text-blue-400 font-bold' : 'text-zinc-300'}`}>
      {value ?? '0'}
    </span>
    {subValue !== undefined && (
      <span className="text-[11px] font-mono tabular-nums text-zinc-500">
        {subValue ?? '0'}
      </span>
    )}
  </div>
)

// --- PÁGINA: JANELA DE DETALHES (POP-OUT) ---

const GamePopoutPage = () => {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('momento')
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const { data: jogo, isLoading, isFetching } = useQuery({
    queryKey: ['jogo-detalhes', id],
    queryFn: async () => {
      const resp = await axios.get(`${API_URL}/jogos/${id}`)
      setLastUpdate(new Date())
      return resp.data
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0
  })

  const { data: historico, isLoading: isLoadingHist } = useQuery({
    queryKey: ['jogo-historico', id],
    queryFn: async () => {
      const resp = await axios.get(`${API_URL}/jogos/${id}/historico`)
      return resp.data
    },
    refetchInterval: 10000,
    enabled: !!id && activeTab === 'momento'
  })

  // Lógica para calcular o delta de 10 minutos
  const calculateDelta10 = (currentVal: number, field: string) => {
    if (!historico || historico.length === 0) return 0
    const nowSnapshot = historico[0]
    const nowTime = nowSnapshot.tempo

    // Buscar o snapshot mais próximo de 10 minutos atrás no tempo de jogo
    const targetTime = Math.max(0, nowTime - 10)
    const oldSnapshot = [...historico].reverse().find((s: any) => s.tempo >= targetTime)

    if (!oldSnapshot) return currentVal
    return Math.max(0, currentVal - (oldSnapshot[field] || 0))
  }

  if (isLoading || isLoadingHist) return <div className="p-8 text-zinc-500 animate-pulse text-xs font-bold uppercase">Sincronizando tempo real...</div>
  if (!jogo) return <div className="p-8 text-red-500 text-xs font-bold uppercase">Jogo não encontrado no banco.</div>

  const snapshot = jogo.snapshots?.[0] || {}

  const momentoStats = [
    { l: 'PI 1', h: snapshot.pi1_casa, a: snapshot.pi1_visitante },
    { l: 'PI 2', h: snapshot.pi2_casa, a: snapshot.pi2_visitante },
    { l: 'PI 3', h: snapshot.pi3_casa, a: snapshot.pi3_visitante },
    { l: 'AP10', h: snapshot.appm10_casa, a: snapshot.appm10_visitante },
    { l: 'CG10', h: snapshot.cg10_casa, a: snapshot.cg10_visitante },
    {
      l: 'CH10 (GOL)',
      h: calculateDelta10(snapshot.chutes_ao_gol_casa, 'chutes_ao_gol_casa'),
      a: calculateDelta10(snapshot.chutes_ao_gol_visitante, 'chutes_ao_gol_visitante')
    },
    {
      l: 'XG10',
      h: Number(calculateDelta10(snapshot.xg_casa, 'xg_casa')).toFixed(2),
      a: Number(calculateDelta10(snapshot.xg_visitante, 'xg_visitante')).toFixed(2)
    },
  ]

  const geralStats = [
    { l: 'Posse de Bola', h: snapshot.posse_casa ? `${Math.round(snapshot.posse_casa)}%` : '0%', a: snapshot.posse_visitante ? `${Math.round(snapshot.posse_visitante)}%` : '0%' },
    { l: 'xG (Expected Goals)', h: snapshot.xg_casa, a: snapshot.xg_visitante },
    { l: 'Ataques', h: snapshot.ataques_casa, a: snapshot.ataques_visitante },
    { l: 'Ataques Perigosos', h: snapshot.ataques_perigosos_casa, a: snapshot.ataques_perigosos_visitante },
    { l: 'Finalizações', h: snapshot.total_chutes_casa, a: snapshot.total_chutes_visitante },
    { l: 'No Alvo', h: snapshot.chutes_ao_gol_casa, a: snapshot.chutes_ao_gol_visitante },
    { l: 'Para Fora', h: snapshot.chutes_fora_casa, a: snapshot.chutes_fora_visitante },
    { l: 'Escanteios', h: snapshot.cantos_casa, a: snapshot.cantos_visitante },
    { l: 'Cartões Amarelos', h: snapshot.cartoes_amarelos_casa, a: snapshot.cartoes_amarelos_visitante },
  ]

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans select-none border border-zinc-900 overflow-hidden text-zinc-200">
      {/* Header Compacto */}
      <div className="p-3 border-b border-zinc-900 bg-zinc-950 flex flex-col gap-2">
        <div className="flex justify-between items-center text-zinc-600">
          <Badge color="zinc">{snapshot.tempo}'</Badge>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] font-display truncate max-w-[200px]">{jogo.liga}</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center h-8">
            <span className="text-base font-black text-zinc-100 uppercase tracking-tighter font-display truncate">{jogo.time_casa}</span>
            <span className="text-2xl font-black text-blue-500 italic tabular-nums font-display">{snapshot.placar_casa ?? 0}</span>
          </div>
          <div className="flex justify-between items-center h-8">
            <span className="text-base font-black text-zinc-100 uppercase tracking-tighter font-display truncate">{jogo.time_visitante}</span>
            <span className="text-2xl font-black text-zinc-400 italic tabular-nums font-display">{snapshot.placar_visitante ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Odds */}
      <div className="p-3 grid grid-cols-4 gap-2 bg-zinc-900/10 border-b border-zinc-900">
        <OddsBox label="CASA" pre={jogo.odds_casa_pre} live={snapshot.odds_casa_live} highlight color="blue" />
        <OddsBox label="FORA" pre={jogo.odds_visitante_pre} live={snapshot.odds_visitante_live} highlight color="red" />
        <OddsBox label="OV25" pre={jogo.odds_over_25_pre} live={snapshot.odds_over_25_live} highlight color="emerald" />
        <OddsBox label="05HT" pre={jogo.odds_over_05_ht_pre} live={snapshot.odds_over_05_ht_live} highlight color="emerald" />
      </div>

      {/* Abas de Navegação */}
      <div className="flex p-1 bg-zinc-950 border-b border-zinc-900 gap-1">
        <button
          onClick={() => setActiveTab('momento')}
          className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm active:scale-95 ${activeTab === 'momento' ? 'bg-zinc-900 text-blue-400 border border-blue-500/20 shadow-md shadow-blue-500/5' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Momento (10m)
        </button>
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm active:scale-95 ${activeTab === 'geral' ? 'bg-zinc-900 text-blue-400 border border-blue-500/20 shadow-md shadow-blue-500/5' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Geral (Jogo)
        </button>
      </div>

      {/* Betfair Link */}
      <div className="p-2">
        <a
          href={`https://www.betfair.bet.br/exchange/plus/football/event/${jogo.link_betfair}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#FFB80B] hover:bg-[#FFC933] text-black h-9 rounded-sm font-black text-[11px] uppercase flex items-center justify-center gap-1.5 transition-all shadow-xl active:scale-[0.98] no-underline border-b-2 border-[#B38000] active:border-0"
        >
          <ExternalLink size={14} />
          Betfair Exchange
        </a>
      </div>

      {/* Seção Dinâmica de Status */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto overflow-x-hidden">
        <div className="flex items-center gap-2 pb-1 border-b border-zinc-900/50">
          <Activity size={12} className="text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {activeTab === 'momento' ? 'Pressão nos Últimos 10 Min' : 'Estatísticas Gerais do Jogo'}
          </span>
        </div>

        {(activeTab === 'momento' ? momentoStats : geralStats).map(item => (
          <PressureBar key={item.l} label={item.l} home={item.h} away={item.a} />
        ))}
      </div>

      {/* Footer Version */}
      <div className="p-2 border-t border-zinc-900 flex justify-between items-center px-4 bg-zinc-950">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isFetching ? 'bg-emerald-500 animate-ping' : 'bg-emerald-800'}`}></div>
          <span className="text-[8px] text-zinc-500 font-black uppercase">LIVE CONNECT</span>
        </div>
        <span className="text-[8px] text-zinc-700 font-mono tracking-widest">
          SYNC: {lastUpdate.toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}

// --- PÁGINA: GESTÃO DE ESTRATÉGIAS ---

const StrategiesPage = () => {
  const [strategies, setStrategies] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [historyStrategyId, setHistoryStrategyId] = useState<string | null>(null)
  const [historyEntries, setHistoryEntries] = useState<any[]>([])
  const [selectedEntryForStats, setSelectedEntryForStats] = useState<any | null>(null)
  const [name, setName] = useState('')
  const [stake, setStake] = useState(10)
  const [targetMarket, setTargetMarket] = useState('over05ht')
  const [activeRules, setActiveRules] = useState<any[]>([])
  const [newRule, setNewRule] = useState({ metric: 'pi1_total', op: '>=', val: 50 })
  const [editingId, setEditingId] = useState<string | null>(null)

  // Estados Telegram
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false)
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [isTestingTelegram, setIsTestingTelegram] = useState(false)

  const fetchTelegramConfig = async () => {
    try {
      const resp = await axios.get(`${API_URL}/config/telegram`)
      if (resp.data.success) {
        setTelegramToken(resp.data.config.telegram_token || '')
        setTelegramChatId(resp.data.config.telegram_chat_id || '')
      }
    } catch (e) {
      console.error('Erro ao buscar config telegram', e)
    }
  }

  const saveTelegramConfig = async () => {
    try {
      await axios.post(`${API_URL}/config/telegram`, {
        token: telegramToken,
        chatId: telegramChatId
      })
      alert('Configurações salvas com sucesso!')
    } catch (e) {
      alert('Erro ao salvar configurações')
    }
  }

  const testTelegramConnection = async () => {
    if (!telegramToken || !telegramChatId) return alert('Preencha o Token e o Chat ID primeiro!')
    setIsTestingTelegram(true)
    try {
      const resp = await axios.post(`${API_URL}/config/telegram/test`, {
        token: telegramToken,
        chatId: telegramChatId
      })
      if (resp.data.success) alert('Mensagem de teste enviada! Confira seu Telegram.')
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erro ao testar conexão')
    } finally {
      setIsTestingTelegram(false)
    }
  }

  useEffect(() => {
    if (isTelegramModalOpen) fetchTelegramConfig()
  }, [isTelegramModalOpen])

  const fetchStrategies = async () => {
    try {
      const resp = await axios.get(`${API_URL}/estrategias`)
      setStrategies(resp.data)
    } catch (err) {
      console.error('Erro ao buscar estratégias:', err)
    }
  }

  const fetchEntries = async () => {
    try {
      const resp = await axios.get(`${API_URL}/entradas`)
      setEntries(resp.data)
    } catch (err) {
      console.error('Erro ao buscar entradas:', err)
    }
  }

  const fetchStrategyHistory = async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/entradas/estrategia/${id}`)
      setHistoryEntries(res.data)
      setHistoryStrategyId(id)
    } catch (err) {
      console.error('Erro ao buscar histórico da estratégia:', err)
    }
  }

  const downloadHistory = () => {
    if (historyEntries.length === 0) return alert('Nenhum dado para exportar!');
    const headers = ['Data', 'Jogo', 'Mercado', 'Odd', 'Status', 'Gols Final'];
    const statKeys = new Set<string>();
    historyEntries.forEach(e => {
      if (e.contexto_stats) Object.keys(e.contexto_stats).forEach(k => statKeys.add(k));
    });
    const allHeaders = [...headers, ...Array.from(statKeys)];
    const csvRows = [allHeaders.join(';')];
    historyEntries.forEach(e => {
      const row = [new Date(e.criado_em).toLocaleString('pt-BR'), `"${e.time_casa} x ${e.time_visitante}"`, e.mercado || '', e.odd_entrada || '', e.status || '', e.placar_final || ''];
      Array.from(statKeys).forEach(k => row.push(e.contexto_stats?.[k] || ''));
      csvRows.push(row.join(';'));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estrategia_adn.csv`;
    a.click();
  };

  const StrategyHistoryModal = () => {
    if (!historyStrategyId) return null;
    const currentStrat = strategies.find(s => s.id === historyStrategyId);
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <div className="bg-[#0b0c14] border border-zinc-800 w-full max-w-5xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/20">
            <div className="flex flex-col">
              <h3 className="text-[14px] font-black uppercase text-zinc-100 italic">Auditoria de Dados (ADN): {currentStrat?.nome}</h3>
              <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1"><Database size={10} /> Registros Brutos da API</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={downloadHistory}
                className="btn-interativo btn-success h-9"
              >
                <Target size={14} /> Exportar Excel
              </button>
              <button
                onClick={() => setHistoryStrategyId(null)}
                className="p-1 px-3 text-zinc-500 hover:text-white transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-3">
              {historyEntries.map((e: any) => (
                <div key={e.id} className="bg-zinc-950 border border-zinc-900 rounded-md p-3">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-zinc-100 uppercase">{e.time_casa} x {e.time_visitante}</span>
                      <span className="text-[9px] text-zinc-600 font-bold">{new Date(e.criado_em).toLocaleString()} - {e.mercado} @ {e.odd_entrada}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-[9px] font-black ${e.status === 'GREEN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{e.status}</div>
                  </div>
                  {e.contexto_stats && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-zinc-900/30 p-2 rounded-sm border border-zinc-900/10">
                      {Object.entries(e.contexto_stats).map(([k, v]: any) => (
                        <div key={k} className="flex flex-col">
                          <span className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter truncate">{k.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-zinc-300 font-mono font-bold">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchStrategies()
    fetchEntries()
    const int = setInterval(() => {
      fetchStrategies()
      fetchEntries()
    }, 30000)
    return () => clearInterval(int)
  }, [])

  const metrics = [
    // --- GRUPO: ESTATÍSTICA LIVE ---
    { id: 'tempo', label: 'Tempo de Jogo', group: 'ESTATISTICAS LIVE' },
    { id: 'pi1_total', label: 'PI 1 Total', group: 'ESTATISTICAS LIVE' },
    { id: 'pi2_total', label: 'PI 2 Total', group: 'ESTATISTICAS LIVE' },
    { id: 'pi3_total', label: 'PI 3 Total', group: 'ESTATISTICAS LIVE' },
    { id: 'appm_total', label: 'APPM Total', group: 'ESTATISTICAS LIVE' },
    { id: 'appm10_total', label: 'APPM 10 Min', group: 'ESTATISTICAS LIVE' },
    { id: 'cg_total', label: 'CG Total (Prob. Gol/Canto)', group: 'ESTATISTICAS LIVE' },
    { id: 'cg10_total', label: 'CG 10 Min', group: 'ESTATISTICAS LIVE' },
    { id: 'xg_total', label: 'XG Total (Gols Esperados)', group: 'ESTATISTICAS LIVE' },
    { id: 'chutes_total', label: 'Chutes Totais', group: 'ESTATISTICAS LIVE' },
    { id: 'chutes_ao_gol_total', label: 'Chutes ao Gol', group: 'ESTATISTICAS LIVE' },
    { id: 'cantos_total', label: 'Escanteios Total', group: 'ESTATISTICAS LIVE' },
    { id: 'placar_total', label: 'Gols Atuais (Total)', group: 'ESTATISTICAS LIVE' },

    // --- GRUPO: ODDS LIVE ---
    { id: 'odd_casa_live', label: 'Odd Casa (LIVE)', group: 'ODDS LIVE' },
    { id: 'odd_visit_live', label: 'Odd Visitante (LIVE)', group: 'ODDS LIVE' },
    { id: 'odd_empate_live', label: 'Odd Empate (LIVE)', group: 'ODDS LIVE' },
    { id: 'odd_ht05_live', label: 'Odd 0.5 HT (LIVE)', group: 'ODDS LIVE' },
    { id: 'odd_ov15_live', label: 'Odd 1.5 FT (LIVE)', group: 'ODDS LIVE' },
    { id: 'odd_ov25_live', label: 'Odd 2.5 FT (LIVE)', group: 'ODDS LIVE' },

    // --- GRUPO: ODDS PRÉ-JOGO ---
    { id: 'odd_casa_pre', label: 'Odd Casa (PRE)', group: 'ODDS PRE-GAME' },
    { id: 'odd_visit_pre', label: 'Odd Visitante (PRE)', group: 'ODDS PRE-GAME' },
    { id: 'odd_ov25_pre', label: 'Odd O2.5 FT (PRE)', group: 'ODDS PRE-GAME' },
    { id: 'odd_ht05_pre', label: 'Odd HT 0.5 (PRE)', group: 'ODDS PRE-GAME' }
  ]

  const markets = [
    { id: 'over05ht', label: '0.5 HT' },
    { id: 'over15', label: '1.5 FT' },
    { id: 'over25', label: '2.5 FT' },
    { id: 'casa', label: 'MO Casa' },
    { id: 'visitante', label: 'MO Fora' },
    { id: 'empate', label: 'MO Empate' },
    { id: 'btts', label: 'BTTS Sim' }
  ]

  const saveStrategy = async () => {
    if (!name || activeRules.length === 0) return
    try {
      const payload = {
        nome: name,
        regras: activeRules,
        mercado: targetMarket,
        stake: Number(stake)
      }

      if (editingId) {
        await axios.patch(`${API_URL}/estrategias/${editingId}`, payload)
      } else {
        await axios.post(`${API_URL}/estrategias`, payload)
      }

      setName('')
      setStake(10)
      setActiveRules([])
      setEditingId(null)
      fetchStrategies()
      alert('Estratégia salva com sucesso!')
    } catch (err) {
      alert('Erro ao salvar estratégia. Verifique o console.')
      console.error('Erro ao salvar estratégia:', err)
    }
  }

  const editStrategy = (s: any) => {
    setName(s.nome)
    setStake(s.stake || 10)
    setTargetMarket(s.mercado || 'over05ht')
    setActiveRules(s.regras)
    setEditingId(s.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteStrategy = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar?')) return
    try {
      await axios.delete(`${API_URL}/estrategias/${id}`)
      fetchStrategies()
    } catch (err) {
      console.error('Erro ao deletar estratégia:', err)
    }
  }

  const toggleBot = async (id: string, currentStatus: any) => {
    const nextStatus = currentStatus === true ? false : true;
    try {
      await axios.patch(`${API_URL}/estrategias/${id}/bot`, { bot_ativo: nextStatus })
      fetchStrategies()
    } catch (err) {
      alert('Erro ao conectar com o servidor para alternar o bot.')
      console.error('Erro ao alternar bot:', err)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4 max-w-5xl">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-sm font-black uppercase tracking-tight text-zinc-100 font-display">Minhas Estratégias</h1>
        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Bot Automático & Simulação</p>
      </div>

      {/* Form de Criação Compacto */}
      <div className="bg-zinc-900/30 border border-zinc-900 rounded-sm p-3 flex flex-col gap-3">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-[9px] font-black uppercase text-zinc-500 ml-0.5">Nome</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: OVER 0.5 HT"
              className="bg-zinc-950 border border-zinc-800 rounded-sm px-2 h-8 text-[11px] font-bold outline-none focus:border-blue-500 transition-colors uppercase"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[100px]">
            <label className="text-[9px] font-black uppercase text-zinc-500 ml-0.5">Mercado</label>
            <select
              value={targetMarket}
              onChange={e => setTargetMarket(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-[10px] font-black uppercase rounded-sm px-1.5 h-8 outline-none focus:border-blue-500 transition-colors"
            >
              {markets.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-24">
            <label className="text-[9px] font-black uppercase text-zinc-500 ml-0.5">Stake (R$)</label>
            <input
              type="number"
              value={stake}
              onChange={e => setStake(Number(e.target.value))}
              placeholder="10.00"
              className="bg-zinc-950 border border-zinc-800 rounded-sm px-2 h-8 text-[11px] font-black tabular-nums outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[300px]">
            <label className="text-[9px] font-black uppercase text-zinc-500 ml-0.5">Configurar Regra</label>
            <div className="flex items-center gap-1.5">
              <select
                value={newRule.metric}
                onChange={e => setNewRule({ ...newRule, metric: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 text-[10px] font-black uppercase rounded-sm px-1.5 h-8 outline-none flex-1 focus:border-blue-500 transition-colors"
                style={{ appearance: 'none' }}
              >
                {Array.from(new Set(metrics.map(m => m.group))).map(group => (
                  <optgroup key={group} label={group} className="bg-zinc-950 text-zinc-500 font-bold uppercase text-[8px] tracking-widest py-2">
                    {metrics.filter(m => m.group === group).map(m => (
                      <option key={m.id} value={m.id} className="text-[10px] text-zinc-100 font-black py-1">
                        {m.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select
                value={newRule.op}
                onChange={e => setNewRule({ ...newRule, op: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 text-[10px] font-black rounded-sm px-1 h-8 outline-none"
              >
                <option value=">=">≥</option>
                <option value="<=">≤</option>
                <option value="==">=</option>
              </select>
              <input
                type="number"
                value={newRule.val}
                onChange={e => setNewRule({ ...newRule, val: Number(e.target.value) })}
                className="w-14 bg-zinc-950 border border-zinc-800 text-[11px] font-black rounded-sm px-1.5 h-8 outline-none tabular-nums"
              />
              <button
                onClick={() => setActiveRules([...activeRules, { ...newRule, id: Date.now() }] as any[])}
                className="btn-interativo btn-secondary h-8 px-4"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Regras Temporárias */}
        <div className="flex flex-wrap gap-1.5 py-1 border-y border-zinc-900/50">
          {activeRules.length === 0 && <span className="text-[9px] text-zinc-700 italic px-1">Defina seus filtros acima...</span>}
          {activeRules.map(r => (
            <div key={r.id} className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-600/10 border border-blue-500/30 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-tight">
              {metrics.find(m => m.id === r.metric)?.label} {r.op} {r.val}
              <button
                onClick={() => setActiveRules(activeRules.filter(x => x.id !== r.id))}
                className="hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveStrategy}
            disabled={!name || activeRules.length === 0}
            className="btn-interativo btn-primary flex-1 h-10 text-[11px]"
          >
            {editingId ? 'Atualizar Robô Inteligente' : 'Ativar Novo Robô de Elite'}
          </button>

          {editingId && (
            <button
              onClick={() => {
                setEditingId(null)
                setName('')
                setActiveRules([])
                setTargetMarket('over05ht')
              }}
              className="btn-interativo btn-secondary px-6 h-10"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Resumo Estratégico do Topo */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-md">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Estratégias Ativas: {strategies.filter(s => s.bot_ativo).length}/{strategies.length}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTelegramModalOpen(true)}
            className="btn-interativo btn-secondary h-8 px-4"
          >
            Config Telegram
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-100 flex items-center gap-2">
          Estratégias Ativas ({strategies.length})
        </h2>
      </div>

      {/* Grid de Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {strategies.map((s: any) => {
          const winRate = (s.greens + s.reds) > 0 ? ((s.greens / (s.greens + s.reds)) * 100).toFixed(1) : '0';
          const pnlValue = Number(s.profit || 0).toFixed(2);
          const roiValue = s.total_entradas > 0 ? ((Number(s.profit) / (s.total_entradas * s.stake)) * 100).toFixed(1) : '0';

          return (
            <div key={s.id} className="bg-[#0b0c14] border border-zinc-900/50 rounded-lg p-5 flex flex-col gap-6 shadow-2xl hover:border-blue-500/30 transition-all group">
              {/* Header do Card */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-md">
                      <MonitorPlay size={14} className="text-blue-500" />
                    </div>
                    <span className="text-[13px] font-black text-zinc-100 uppercase tracking-tight">{s.nome}</span>
                    <span className="text-[9px] text-zinc-600 font-bold">({new Date(s.criado_em).toLocaleDateString('pt-BR')})</span>
                  </div>
                  <span className="text-[9px] font-black text-blue-500/70 uppercase tracking-widest ml-1">Mercado: {markets.find(m => m.id === s.mercado)?.label || s.mercado}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end mr-2">
                    <span className={`text-[9px] font-black uppercase ${s.bot_ativo ? 'text-emerald-500' : 'text-zinc-600'}`}>
                      {s.bot_ativo ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleBot(s.id, s.bot_ativo)}
                    className={`w-10 h-5 rounded-full relative transition-all ${s.bot_ativo ? 'bg-blue-600' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${s.bot_ativo ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {/* Performance Stats Row */}
              <div className="grid grid-cols-2 gap-4 border-t border-zinc-900/30 pt-4">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Envios: {s.total_entradas}</span>
                    <div className="flex gap-2 text-[10px] font-black">
                      <span className="text-emerald-500">G {s.greens}</span>
                      <span className="text-red-500">R {s.reds}</span>
                      <span className="text-blue-400">P {s.pendentes}</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden flex">
                    <div style={{ width: `${(s.greens / s.total_entradas) * 100}%` }} className="h-full bg-emerald-500" />
                    <div style={{ width: `${(s.reds / s.total_entradas) * 100}%` }} className="h-full bg-red-500" />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-black text-zinc-100 font-display">{winRate}%</span>
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter italic">Taxa de Acerto</span>
                </div>
              </div>

              {/* Financial Stats Row */}
              <div className="grid grid-cols-4 gap-2 py-4 border-y border-zinc-900/30">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Lucro (R$)</span>
                  <span className={`text-[11px] font-black ${Number(s.profit) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>R$ {pnlValue}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">ROI</span>
                  <span className={`text-[11px] font-black ${Number(roiValue) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{roiValue}%</span>
                </div>
                <div className="flex flex-col border-l border-zinc-900/50 pl-2">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Stake</span>
                  <span className="text-[11px] font-black text-zinc-100">R$ {s.stake}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Win %</span>
                  <span className="text-[11px] font-black text-zinc-100 font-mono tracking-tighter">{winRate}%</span>
                </div>
              </div>

              {/* Condições Column */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-2 py-1 bg-zinc-900/50 rounded-sm w-fit">Critérios de Entrada</span>
                <ul className="flex flex-col gap-1.5 px-1">
                  {ensureArray(s.regras).map((r: any) => (
                    <li key={r.id || Math.random()} className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                      <div className="w-1 h-1 rounded-full bg-blue-500" />
                      {metrics.find(m => m.id === r.metric)?.label}: <span className="text-zinc-200 ml-1">{r.op} {r.val}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botões de Ação Rodapé */}
              <div className="mt-auto grid grid-cols-3 gap-2 pt-4 border-t border-zinc-900/50">
                <button
                  onClick={() => editStrategy(s)}
                  className="btn-interativo btn-secondary h-8"
                >
                  <Pencil size={11} /> Editar
                </button>
                <button
                  onClick={() => fetchStrategyHistory(s.id)}
                  className="btn-interativo btn-secondary h-8"
                >
                  <History size={11} /> Histórico
                </button>
                <button
                  onClick={() => deleteStrategy(s.id)}
                  className="btn-interativo btn-danger h-8"
                >
                  <Trash size={11} /> Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <StrategyHistoryModal />

      {/* MODAL: CONFIG TELEGRAM */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0b0c14] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/20">
                <div className="flex flex-col">
                  <h3 className="text-[14px] font-black uppercase text-zinc-100 italic flex items-center gap-2">
                    <Bell size={16} className="text-blue-500" /> Alertas Telegram
                  </h3>
                  <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Configuração de Sinais Live</span>
                </div>
                <button onClick={() => setIsTelegramModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-2"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase">Bot Token (@BotFather)</label>
                  <input
                    type="password"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder="Ex: 123456789:ABCDefGhIjKlMnOpQrStUvWxYz"
                    className="w-full bg-zinc-950/50 border border-zinc-900 rounded-md px-3 py-2 text-[11px] text-zinc-100 placeholder:text-zinc-700 focus:border-blue-500/50 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase">Chat ID (Grupo/Canal)</label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="Ex: -100123456789"
                    className="w-full bg-zinc-950/50 border border-zinc-900 rounded-md px-3 py-2 text-[11px] text-zinc-100 placeholder:text-zinc-700 focus:border-blue-500/50 transition-all outline-none"
                  />
                  <p className="text-[8px] text-zinc-600 italic">Dica: Adicione o bot ao grupo e use o @userinfobot para descobrir o ID do chat.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-900/50">
                  <button
                    onClick={testTelegramConnection}
                    disabled={isTestingTelegram}
                    className="btn-interativo btn-secondary h-10"
                  >
                    {isTestingTelegram ? 'Enviando...' : 'Testar Conexão'}
                  </button>
                  <button
                    onClick={async () => {
                      await saveTelegramConfig()
                      setIsTelegramModalOpen(false)
                    }}
                    className="btn-interativo btn-primary h-10"
                  >
                    Salvar & Ativar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Histórico Global (Atividade Recente) */}
      <div className="mt-8 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-100">Live Bot Activity</h2>
        </div>

        <div className="bg-zinc-950/40 border border-zinc-900 rounded-sm overflow-hidden min-h-[200px]">
          {entries.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-zinc-600 gap-2 opacity-30">
              <Clock className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Aguardando primeira entrada...</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900/50">
              {entries.map((e: any) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={e.id}
                  className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-10 bg-emerald-500/20 rounded-full flex flex-col items-center justify-center overflow-hidden">
                      <div className="w-full h-1/2 bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-zinc-100 uppercase">{e.time_casa} vs {e.time_visitante}</span>
                        <Badge color="zinc">{e.placar_momento}</Badge>
                        {e.status === 'GREEN' && <Badge color="emerald">GREEN</Badge>}
                        {e.status === 'RED' && <Badge color="red">RED</Badge>}
                        {(e.status === 'BOT' || e.status === 'PENDENTE') && <Badge color="blue">ANALISANDO</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-600" /> {e.tempo_momento}'</span>
                        <span className="flex items-center gap-1 text-emerald-400/80">
                          <Target className="w-3 h-3 text-emerald-500/50" /> {e.mercado} @ {e.odd_entrada ? Number(e.odd_entrada).toFixed(2) : '0.00'}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400 group-hover:text-blue-300">
                          <CheckCircle className="w-3 h-3 text-blue-500/50" /> {e.estrategia_nome || 'Auto-Bot'} {e.placar_final ? `(FIM: ${e.placar_final})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">
                      {new Date(e.criado_em).toLocaleTimeString('pt-BR')}
                    </span>
                    <button
                      onClick={async () => {
                        if (confirm('Remover do log?')) {
                          await axios.delete(`${API_URL}/entradas/${e.id}`)
                          fetchEntries()
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 transition-all p-1"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE: LISTA DE JOGOS ---

const TargetIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const LiveGamesPage = () => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null)
  const [registeringEntryId, setRegisteringEntryId] = useState<string | null>(null)

  const { data: strategies = [] } = useQuery({
    queryKey: ['estrategias'],
    queryFn: async () => {
      const resp = await axios.get(`${API_URL}/estrategias`)
      return resp.data
    }
  })

  const { data: jogos, isLoading } = useQuery({
    queryKey: ['jogos-ao-vivo'],
    queryFn: async () => {
      const resp = await axios.get(`${API_URL}/jogos/ao-vivo`)
      return resp.data
    },
    refetchInterval: 30000
  })

  const selectedStrategy = strategies.find((s: any) => s.id === selectedStrategyId)

  // Função para registrar entrada rápida baseada na estratégia
  const handleRegisterStrategyEntry = async (jogoId: string) => {
    // Se tiver estratégia selecionada, usa o mercado dela. Senão usa 'over05ht' como fallback.
    const mercado = selectedStrategy?.mercado || 'over05ht'

    setRegisteringEntryId(jogoId)
    try {
      await axios.post(`${API_URL}/entradas`, {
        jogo_id: jogoId,
        mercado,
        estrategia_id: selectedStrategyId
      })
      setTimeout(() => setRegisteringEntryId(null), 1000)
    } catch (err) {
      console.error('Erro ao registrar entrada:', err)
      setRegisteringEntryId(null)
    }
  }


  // Função para verificar se um jogo bate os critérios de uma estratégia
  const matchesStrategy = (jogo: any, strategy: any) => {
    if (!strategy) return true
    const regras = ensureArray(strategy.regras)
    if (regras.length === 0) return true
    const snap = jogo.snapshots?.[0] || {}

    return regras.every((f: any) => {
      let valJ = 0
      if (f.metric === 'pi1_total') valJ = Number(snap.pi1_casa || 0) + Number(snap.pi1_visitante || 0)
      if (f.metric === 'pi2_total') valJ = Number(snap.pi2_casa || 0) + Number(snap.pi2_visitante || 0)
      if (f.metric === 'pi3_total') valJ = Number(snap.pi3_casa || 0) + Number(snap.pi3_visitante || 0)
      if (f.metric === 'appm_total') valJ = Number(snap.appm_casa || 0) + Number(snap.appm_visitante || 0)
      if (f.metric === 'tempo') valJ = Number(snap.tempo || 0)
      if (f.metric === 'cantos_total') valJ = Number(snap.cantos_casa || 0) + Number(snap.cantos_visitante || 0)
      if (f.metric === 'placar_total') valJ = Number(snap.placar_casa || 0) + Number(snap.placar_visitante || 0)
      if (f.metric === 'odd_casa_pre') valJ = Number(jogo.odds_casa_pre || 0)
      if (f.metric === 'odd_visit_pre') valJ = Number(jogo.odds_visitante_pre || 0)
      if (f.metric === 'odd_ov25_pre') valJ = Number(jogo.odds_over_25_pre || 0)
      if (f.metric === 'odd_ht05_pre') valJ = Number(jogo.odds_over_05_ht_pre || 0)

      if (f.op === '>=') return valJ >= Number(f.val)
      if (f.op === '<=') return valJ <= Number(f.val)
      if (f.op === '==') return valJ === Number(f.val)
      return true
    })
  }

  const filteredJogos = jogos?.filter((j: any) => selectedStrategyId ? matchesStrategy(j, selectedStrategy) : true)

  const openPopout = (jogoId: string) => {
    const width = 360
    const height = 580
    const left = (window.screen.width / 2) - (width / 2)
    const top = (window.screen.height / 2) - (height / 2)
    window.open(`/jogo/${jogoId}`, `jogo_${jogoId}`, `width=${width},height=${height},left=${left},top=${top},resizable=yes`)
  }

  if (isLoading) return <div className="p-8 text-zinc-500 animate-pulse text-[10px] font-black uppercase tracking-widest">Carregando cockpit...</div>

  return (
    <div className="flex flex-col w-full">
      {/* Barra de Filtros Dinâmicos */}
      <div className="flex items-center gap-3 px-4 h-11 border-b border-zinc-900 bg-zinc-950/80 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2 pr-4 border-r border-zinc-900">
          <Activity size={12} className="text-zinc-600" />
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">Cockpit</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedStrategyId(null)}
            className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all whitespace-nowrap border ${!selectedStrategyId ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-transparent text-zinc-600 border-zinc-800 hover:text-zinc-400'}`}
          >
            Tudo ({jogos?.length || 0})
          </button>
          {strategies.map((s: any) => {
            const count = jogos?.filter((j: any) => matchesStrategy(j, s)).length || 0
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStrategyId(s.id)}
                className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all whitespace-nowrap border ${selectedStrategyId === s.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
              >
                {s.nome} <span className={`ml-1.5 opacity-60 ${count > 0 ? 'text-blue-400 font-black' : ''}`}>({count})</span>
              </button>
            )
          })}
          {strategies.length === 0 && (
            <span className="text-[10px] text-zinc-700 italic font-medium px-2">Nenhuma estratégia salva</span>
          )}
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center bg-zinc-950 border-b border-zinc-900 h-10 px-2 sticky top-11 z-10 transition-all">
        <div className="w-[180px] flex items-center font-bold text-[10px] text-zinc-500 uppercase tracking-wider pl-4">JOGO</div>
        <HeaderLabel className="w-[45px]">Tempo</HeaderLabel>
        <div className="flex flex-1 justify-between px-1">
          <HeaderLabel className="min-w-[34px]" tooltip="Pressão Inicial 1">PI1</HeaderLabel>
          <HeaderLabel className="min-w-[34px]" tooltip="Pressão Inicial 2">PI2</HeaderLabel>
          <HeaderLabel className="min-w-[34px]" tooltip="Pressão Inicial 3">PI3</HeaderLabel>
          <HeaderLabel className="min-w-[34px]" tooltip="Ataques Perigosos por Minuto">APPM</HeaderLabel>
          <HeaderLabel className="min-w-[34px]" tooltip="AP nos últimos 10 min">AP10</HeaderLabel>
          <HeaderLabel className="min-w-[34px]" tooltip="Chance de Gol">CG</HeaderLabel>
          <HeaderLabel className="min-w-[34px]" tooltip="CG nos últimos 10 min">CG10</HeaderLabel>
          <HeaderLabel className="min-w-[34px]" tooltip="Gols Esperados (XG)">XG</HeaderLabel>
          <HeaderLabel className="min-w-[34px]" tooltip="Chutes Alvo / Total">CH / T</HeaderLabel>
          <HeaderLabel className="min-w-[34px]" tooltip="Escanteios">CANT</HeaderLabel>
          <HeaderLabel className="min-w-[34px]" tooltip="Posse">POSS</HeaderLabel>
          <HeaderLabel className="min-w-[28px]" tooltip="Amarelos">AM</HeaderLabel>
          <HeaderLabel className="min-w-[28px]" tooltip="Vermelhos">VM</HeaderLabel>
        </div>
        <div className="flex gap-1 ml-2 pr-6">
          <HeaderLabel className="w-[42px]">CASA</HeaderLabel>
          <HeaderLabel className="w-[42px]">FORA</HeaderLabel>
          <HeaderLabel className="w-[42px]">OV25</HeaderLabel>
          <HeaderLabel className="w-[42px]">05HT</HeaderLabel>
        </div>
      </div>

      <div className="flex flex-col">
        {filteredJogos?.map((jogo: any) => {
          const snapshot = jogo.snapshots?.[0] || {}
          // Verificar quais estratégias este jogo bate
          const matchedStrats = strategies.filter((s: any) => matchesStrategy(jogo, s)).slice(0, 2)

          return (
            <div
              key={jogo.id}
              className="group flex h-[48px] items-center px-2 border-b border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900 transition-all relative"
            >
              {/* Botão SNIPER (Registro Inteligente) */}
              <div className="absolute left-[2px] z-30 flex items-center h-full">
                <button
                  onClick={() => handleRegisterStrategyEntry(jogo.id)}
                  title={selectedStrategy ? `Registrar entrada em ${selectedStrategy.mercado}` : "Registrar entrada (0.5 HT)"}
                  className={`p-1.5 rounded-full transition-all ${registeringEntryId === jogo.id ? 'text-emerald-400 scale-125 bg-emerald-500/20' : 'text-zinc-800 hover:text-blue-500 opacity-0 group-hover:opacity-100'}`}
                >
                  <TargetIcon size={14} className={registeringEntryId === jogo.id ? "animate-pulse" : ""} />
                </button>
              </div>

              <div
                onClick={() => openPopout(jogo.id)}
                className="w-[180px] flex flex-col justify-center gap-0 pl-6 relative cursor-pointer"
              >
                <div className="flex items-center justify-between pr-2">
                  <div className="flex items-center gap-1.5 truncate select-text">
                    <span className="text-[11px] font-bold text-zinc-100 truncate font-display uppercase tracking-tighter select-text cursor-text">{jogo.time_casa}</span>
                    <div className="flex gap-0.5">
                      {matchedStrats.map((ms: any) => (
                        <div key={ms.id} className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                      ))}
                    </div>
                  </div>
                  <span className="text-[12px] font-black text-blue-500 tabular-nums font-display">{snapshot.placar_casa ?? 0}</span>
                </div>
                <div className="flex items-center justify-between pr-2">
                  <span className="text-[11px] font-bold text-zinc-100 truncate font-display uppercase tracking-tighter select-text cursor-text">{jogo.time_visitante}</span>
                  <span className="text-[12px] font-black text-zinc-500 tabular-nums font-display">{snapshot.placar_visitante ?? 0}</span>
                </div>
                {/* Tooltip discreto de estratégias que o jogo atende */}
                {matchedStrats.length > 0 && (
                  <div className="absolute -left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 w-1 flex flex-col gap-0.5 py-1 rounded-full h-8 top-1/2 -translate-y-1/2"></div>
                )}
              </div>

              <div className="w-[45px] flex items-center justify-center border-r border-zinc-800/30 h-full">
                <span className="text-[11px] font-black text-zinc-100 tabular-nums">
                  {snapshot.tempo ?? '--'}<span className="animate-pulse text-white font-black ml-px">'</span>
                </span>
              </div>

              <div className="flex flex-1 h-full items-center justify-between px-1">
                <StatColumnCell value={snapshot.pi1_casa} subValue={snapshot.pi1_visitante} />
                <StatColumnCell value={snapshot.pi2_casa} subValue={snapshot.pi2_visitante} />
                <StatColumnCell value={snapshot.pi3_casa} subValue={snapshot.pi3_visitante} />
                <StatColumnCell value={snapshot.appm_casa} subValue={snapshot.appm_visitante} highlight />
                <StatColumnCell value={snapshot.appm10_casa} subValue={snapshot.appm10_visitante} />
                <StatColumnCell value={snapshot.cg_casa} subValue={snapshot.cg_visitante} />
                <StatColumnCell value={snapshot.cg10_casa} subValue={snapshot.cg10_visitante} />
                <StatColumnCell value={snapshot.xg_casa} subValue={snapshot.xg_visitante} />
                <StatColumnCell value={`${snapshot.chutes_ao_gol_casa ?? 0}/${snapshot.total_chutes_casa ?? 0}`} subValue={`${snapshot.chutes_ao_gol_visitante ?? 0}/${snapshot.total_chutes_visitante ?? 0}`} />
                <StatColumnCell value={snapshot.cantos_casa} subValue={snapshot.cantos_visitante} />
                <StatColumnCell value={snapshot.posse_casa ? `${Math.round(snapshot.posse_casa)}%` : '0%'} subValue={snapshot.posse_visitante ? `${Math.round(snapshot.posse_visitante)}%` : '0%'} />
                <div className="flex flex-col items-center justify-center min-w-[28px] gap-0.5 border-r border-zinc-800/30 h-full">
                  <Badge color="zinc">{snapshot.cartoes_amarelos_casa ?? 0}</Badge>
                  <Badge color="zinc">{snapshot.cartoes_amarelos_visitante ?? 0}</Badge>
                </div>
                <div className="flex flex-col items-center justify-center min-w-[28px] gap-0.5 h-full">
                  <Badge color={snapshot.cartoes_vermelhos_casa > 0 ? "red" : "zinc"}>{snapshot.cartoes_vermelhos_casa ?? 0}</Badge>
                  <Badge color={snapshot.cartoes_vermelhos_visitante > 0 ? "red" : "zinc"}>{snapshot.cartoes_vermelhos_visitante ?? 0}</Badge>
                </div>
              </div>

              <div className="flex gap-1 ml-2 pr-4 w-[220px]">
                <OddsBox pre={jogo.odds_casa_pre} live={snapshot.odds_casa_live} highlight color="blue" />
                <OddsBox pre={jogo.odds_visitante_pre} live={snapshot.odds_visitante_live} highlight color="red" />
                <OddsBox pre={jogo.odds_over_25_pre} live={snapshot.odds_over_25_live} highlight color="emerald" />
                <OddsBox pre={jogo.odds_over_05_ht_pre} live={snapshot.odds_over_05_ht_live} highlight color="emerald" />
              </div>

              <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={12} className="text-zinc-500" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const NavItem = ({ icon, label, active = false, onClick, isCollapsed }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-sm transition-all relative group ${active ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border-l-2 border-transparent'}`}>
    <div className="shrink-0">{icon}</div>
    <AnimatePresence>
      {!isCollapsed && (
        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-sm font-medium whitespace-nowrap overflow-hidden">
          {label}
        </motion.span>
      )}
    </AnimatePresence>
    {isCollapsed && (
      <div className="absolute left-14 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
        {label}
      </div>
    )}
  </button>
)

const DashboardLayout = () => {
  const [currentPage, setCurrentPage] = useState('ao-vivo')
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <motion.aside animate={{ width: isCollapsed ? 64 : 220 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="border-r border-zinc-900 flex flex-col bg-zinc-950 shrink-0 z-40 relative shadow-2xl">
        <div className="h-14 flex items-center px-4 justify-between border-b border-zinc-900/50">
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-xs">B</div>
              <span className="text-base font-black tracking-tighter uppercase whitespace-nowrap">bol<span className="text-blue-500">bet</span></span>
            </motion.div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={`p-1.5 rounded-sm hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors ${isCollapsed ? 'mx-auto' : ''}`}>
            {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="flex-1 p-2 mt-2 space-y-1">
          <NavItem icon={<MonitorPlay size={18} />} label="Jogos ao Vivo" active={currentPage === 'ao-vivo'} onClick={() => setCurrentPage('ao-vivo')} isCollapsed={isCollapsed} />
          <NavItem icon={<Activity size={18} />} label="Estratégias" active={currentPage === 'estrategias'} onClick={() => setCurrentPage('estrategias')} isCollapsed={isCollapsed} />
          <NavItem icon={<History size={18} />} label="Finalizados" active={currentPage === 'finalizados'} onClick={() => setCurrentPage('finalizados')} isCollapsed={isCollapsed} />
        </nav>
        <div className="p-2 border-t border-zinc-900/50 bg-zinc-950/20">
          <NavItem icon={<Settings size={18} />} label="Configurações" isCollapsed={isCollapsed} />
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 shrink-0 bg-zinc-950/30 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">Dash</span>
            <ArrowRight size={10} className="text-zinc-800" />
            <span className="text-xs font-black tracking-tight uppercase text-zinc-300">
              {currentPage === 'estrategias' ? 'Gestão de Estratégias' : 'Jogos ao Vivo'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-zinc-500 hover:text-zinc-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-zinc-950"></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-zinc-900">
              <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-700 text-[10px] flex items-center justify-center font-black text-blue-400">JT</div>
              <span className="text-[11px] font-bold text-zinc-400 hidden md:block">Julio Trader</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-black relative">
          {currentPage === 'estrategias' ? <StrategiesPage /> : <LiveGamesPage />}
          <div className="fixed bottom-3 right-4 z-50">
            <span className="px-2 py-0.5 rounded-sm bg-zinc-900/80 backdrop-blur text-[9px] font-mono text-zinc-700 border border-zinc-800/50 select-none uppercase">v1.6.0-strategies</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardLayout />} />
          <Route path="/jogo/:id" element={<GamePopoutPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}
