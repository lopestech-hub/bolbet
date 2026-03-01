
import { FastifyInstance } from 'fastify'
import prisma from '../../prisma'
import { NotificacaoService } from '../../services/notificacao.service'

export default async function (fastify: FastifyInstance) {

    // Listar todas as entradas simuladas
    fastify.get('/', async () => {
        try {
            return await prisma.$queryRaw`
                SELECT e.*, j.time_casa, j.time_visitante, j.liga, est.nome as estrategia_nome
                FROM "entradas" e
                JOIN "jogos" j ON e.jogo_id = j.id
                LEFT JOIN "estrategias" est ON e.estrategia_id = est.id
                ORDER BY e.criado_em DESC
                LIMIT 50
            `
        } catch (error) {
            fastify.log.error(error)
            return { success: false, error: 'Falha ao buscar entradas' }
        }
    })

    // Listar entradas de uma estratégia específica (Histórico)
    fastify.get('/estrategia/:id', async (request: any, reply) => {
        const { id } = request.params
        try {
            return await prisma.$queryRaw`
                SELECT e.*, j.time_casa, j.time_visitante, j.liga
                FROM "entradas" e
                JOIN "jogos" j ON e.jogo_id = j.id
                WHERE e.estrategia_id = ${id}
                ORDER BY e.criado_em DESC
                LIMIT 100
            `
        } catch (error) {
            fastify.log.error(error)
            return reply.status(500).send({ success: false, error: 'Falha ao buscar histórico' })
        }
    })

    // Registrar nova entrada AUTOMÁTICA
    fastify.post('/', async (request: any, reply) => {
        const { jogo_id, mercado, estrategia_id } = request.body

        try {
            // Busca o último snapshot do jogo para pegar Odd e Stats atuais
            const snapshot: any = await prisma.snapshots.findFirst({
                where: { jogo_id },
                orderBy: { capturado_em: 'desc' }
            })

            if (!snapshot) {
                return reply.status(404).send({ success: false, error: 'Jogo sem dados live no momento' })
            }

            // Mapeamento de mercados para as colunas de Odd no banco
            const marketMap: any = {
                'casa': 'odds_casa_live',
                'visitante': 'odds_visitante_live',
                'empate': 'odds_empate_live',
                'over05ht': 'odds_over_05_ht_live',
                'over15': 'odds_over_15_live',
                'over25': 'odds_over_25_live',
                'btts': 'odds_btts_sim_live'
            }

            const oddField = marketMap[mercado]
            const oddValue = (snapshot[oddField] || 0)

            const placar_momento = `${snapshot.placar_casa}-${snapshot.placar_visitante}`
            const tempo_momento = snapshot.tempo

            // Congela o contexto de stats (opcional para análise de padrão)
            const contexto_stats = JSON.stringify(snapshot)

            await prisma.$executeRaw`
                INSERT INTO "entradas" 
                ("jogo_id", "estrategia_id", "mercado", "odd_entrada", "placar_momento", "tempo_momento", "contexto_stats") 
                VALUES 
                (${jogo_id}, ${estrategia_id || null}, ${mercado}, ${oddValue}, ${placar_momento}, ${tempo_momento}, ${contexto_stats}::jsonb)
            `

            // --- DISPARAR ALERTA TELEGRAM ---
            try {
                // IDs podem vir como string ou number dependendo da fonte
                const jId = String(jogo_id);
                const sId = estrategia_id ? Number(estrategia_id) : null;

                console.log(`📡 Gatilho capturado: Jogo ${jId}, Estrategia ${sId || 'Sniper'}`);

                const jogo: any = await prisma.jogos.findUnique({ where: { id: jId } });
                const estrategia: any = (sId && !isNaN(sId)) ? await prisma.estrategias.findUnique({ where: { id: sId } }) : null;

                if (jogo) {
                    console.log(`🔥 Transmitindo alerta para ${jogo.time_casa} @ ${oddValue}...`);
                    NotificacaoService.enviarAlerta({
                        time_casa: jogo.time_casa,
                        time_visitante: jogo.time_visitante,
                        mercado: mercado,
                        odd_entrada: oddValue,
                        tempo_momento: tempo_momento,
                        estrategia_nome: estrategia?.nome || 'Sniper Manual',
                        link_betfair: jogo.link_betfair
                    });
                } else {
                    console.log(`⚠️ Jogo ${jId} não encontrado. Alerta skipado.`);
                }
            } catch (err) {
                console.error('❌ Erro no gatilho de alerta (não fatal):', err);
            }

            return { success: true, odd_capturada: oddValue }
        } catch (error) {
            fastify.log.error(error)
            return reply.status(500).send({ success: false, error: 'Erro ao processar entrada automática' })
        }
    })

    // Deletar entrada
    fastify.delete('/:id', async (request: any, reply) => {
        const { id } = request.params
        try {
            await prisma.$executeRaw`DELETE FROM "entradas" WHERE "id" = ${id}`
            return { success: true }
        } catch (error) {
            return reply.status(500).send({ success: false, error: 'Erro ao deletar' })
        }
    })
}
