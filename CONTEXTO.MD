# bolbet
>
> Memória viva. Atualizado automaticamente após qualquer mudança e antes de encerrar cada sessão.

## 🎯 Objetivo

Painel de trader esportivo para monitoramento de jogos ao vivo, finalizados e simulações de apostas baseadas em parâmetros estáticos e dinâmicos (snapshots).

## 👥 Usuários e Perfis

- Administrador único (uso pessoal).

## ⚙️ Regras de Negócio

1. Monitoramento de Jogos Ao Vivo (Polling a cada 10-30s).
2. Integração de dados de snapshots (Ataques Perigosos, Odds Live, APPM).
3. Simulação de apostas quando parâmetros específicos forem atingidos.
4. Histórico de jogos finalizados.

## 📦 Stack

- Frontend: React + Vite + TS + Tailwind | Libs: TanStack Query, Zustand, Phosphor Icons, Lucide, Framer Motion, Shadcn UI.
- Backend: Node.js + Fastify + Prisma + PostgreSQL | Libs: Pino.
- Auth: Uso pessoal (sem autenticação complexa por enquanto).
- Logs: Pino + pino-pretty | Nível produção: info.
- MCP: `tradebet-api` (banco de dados).
- Infra: VPS + Coolify | Deploy: GitHub push → auto deploy | Timezone: America/Sao_Paulo.

## 🗄️ Banco de Dados

### Tabelas (nomes em Português)

- `jogos`: Dados estruturais e pré-jogo.
- `snapshots`: Dados dinâmicos capturados em tempo real.

## 🔌 Rotas da API

| Método | Rota | Descrição | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/jogos/ao-vivo` | Lista jogos AO_VIVO + último snapshot | Não |
| `GET` | `/api/jogos/finalizados` | Lista jogos finalizados | Não |
| `GET` | `/api/jogos/:id/historico` | Snapshots de um jogo específico | Não |

## 📁 Estrutura de Pastas Atual

```text
bolbet/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   ├── config/
│   │   └── prisma/
│   └── scripts/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── store/
├── Dockerfile
└── CONTEXTO.MD
```

## 🔧 Variáveis de Ambiente

```env
DATABASE_URL="postgresql://user:pass@host:5432/tradebet?schema=public"
TZ=America/Sao_Paulo
PORT=3000
NODE_ENV=development
```

## 🚀 Roadmap

- [x] Setup inicial (Monorepo, Fastify, Vite).
- [x] Conexão com banco de dados real VPS (stratbet_pi).
- [x] Sincronização do Schema Prisma (v6.4.1).
- [x] Implementação do Cockpit de Trader (Frontend Denso).
- [ ] Lógica de alertas e simulações baseadas em parâmetros.

## 📝 Decisões Técnicas

1. **Polling vs WebSockets:** Escolhido polling de 30s devido à frequência de atualização da fonte de dados (banco alimentado a cada 30s).
2. **Design Engineer:** Estilo "Precision & Density" para dashboard técnico, inspirado em cockpits profissionais de trading esportivo.
3. **Versão Prisma:** Utilizado Prisma v6.4.1 por estabilidade na leitura de datasource URLs via `.env`.

## ⚠️ Problemas Conhecidos

- N/A

## 📅 Última Sessão — O que foi feito e testado

- Conexão bem-sucedida ao banco `stratbet_pi` na VPS.
- Implementação total do frontend `App.tsx` com colunas de estatísticas (PI1, PI2, APPM, etc) e Odds Live.
- Layout de "Linha Dupla" para times e placar, otimizado para monitoramento simultâneo de muitos jogos.

## ➡️ Próximos Pasos

- Implementar as rotas reais no Backend para servir os dados ao cockpit.
- Adicionar lógica de filtros e alertas personalizados.
