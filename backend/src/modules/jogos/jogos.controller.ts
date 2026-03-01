import { FastifyInstance } from 'fastify'
import prisma from '../../prisma'

export default async function (fastify: FastifyInstance) {

    // Listar jogos ao vivo com o último snapshot detalhado
    fastify.get('/ao-vivo', async () => {
        try {
            // Buscamos jogos AO_VIVO que sejam recentes (criados nos últimos 15 min)
            // OU que tenham recebido dados na última 1 hora.
            // Isso garante que o minuto 0 apareça e os fantasmas sumam.
            const liveGames: any[] = await prisma.$queryRaw`
                SELECT j.*, 
                (SELECT row_to_json(s) FROM "snapshots" s WHERE s.jogo_id = j.id ORDER BY s.capturado_em DESC LIMIT 1) as snapshot_data
                FROM "jogos" j
                WHERE j.status IN ('AO_VIVO', 'IN_PLAY')
                AND (
                    j.criado_em > NOW() - INTERVAL '15 minutes'
                    OR EXISTS (
                        SELECT 1 FROM "snapshots" s 
                        WHERE s.jogo_id = j.id 
                        AND s.capturado_em > NOW() - INTERVAL '10 minutes'
                    )
                )
                ORDER BY j.criado_em DESC
            `

            const formatted = liveGames.map(g => ({
                ...g,
                snapshots: g.snapshot_data ? [g.snapshot_data] : []
            }))

            return formatted
        } catch (error) {
            fastify.log.error(error)
            return { success: false, error: 'Falha ao buscar jogos ao vivo' }
        }
    })

    // Listar jogos finalizados
    fastify.get('/finalizados', async () => {
        try {
            return await prisma.jogos.findMany({
                where: { status: 'FINALIZADO' },
                orderBy: { criado_em: 'desc' },
                take: 50,
                include: {
                    snapshots: {
                        orderBy: { capturado_em: 'desc' },
                        take: 1
                    }
                }
            })
        } catch (error) {
            fastify.log.error(error)
            return { success: false, error: 'Falha ao buscar histórico' }
        }
    })

    // Buscar UM jogo específico com último snapshot (para Pop-out)
    fastify.get('/:id', async (request: any, reply) => {
        const { id } = request.params
        try {
            const jogo = await prisma.jogos.findUnique({
                where: { id: id }, // ID é TEXT no banco
                include: {
                    snapshots: {
                        orderBy: { capturado_em: 'desc' },
                        take: 1
                    }
                }
            })
            return jogo
        } catch (error) {
            reply.status(500).send({ error: 'Erro ao buscar jogo' })
        }
    })

    // Listar histórico de um jogo
    fastify.get('/:id/historico', async (request: any, reply) => {
        const { id } = request.params
        try {
            const historico = await prisma.snapshots.findMany({
                where: { jogo_id: id }, // Jogo_id também é TEXT
                orderBy: { capturado_em: 'desc' }
            })
            return historico
        } catch (error) {
            reply.status(500).send({ error: 'Erro ao consultar histórico' })
        }
    })
}
