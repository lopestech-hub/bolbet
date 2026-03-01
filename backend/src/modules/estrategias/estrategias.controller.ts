
import { FastifyInstance } from 'fastify'
import prisma from '../../prisma'

export default async function (fastify: FastifyInstance) {

    // Listar todas as estratégias com métricas de performance
    fastify.get('/', async () => {
        try {
            // Query poderosas trazemos dados crus para processar no JS (evita erro de BigInt do SQL)
            const raw: any[] = await prisma.$queryRaw`
                SELECT 
                    e.*,
                    (SELECT COUNT(*) FROM "entradas" WHERE estrategia_id = e.id) as total_entradas,
                    (SELECT COUNT(*) FROM "entradas" WHERE estrategia_id = e.id AND status = 'GREEN') as greens,
                    (SELECT COUNT(*) FROM "entradas" WHERE estrategia_id = e.id AND status = 'RED') as reds,
                    (SELECT COUNT(*) FROM "entradas" WHERE estrategia_id = e.id AND (status = 'BOT' OR status = 'PENDENTE')) as pendentes,
                    (SELECT COALESCE(SUM(CAST(odd_entrada AS FLOAT) - 1), 0) FROM "entradas" WHERE estrategia_id = e.id AND status = 'GREEN') as green_profit,
                    (SELECT COUNT(*) FROM "entradas" WHERE estrategia_id = e.id AND status = 'RED') as red_losses
                FROM "estrategias" e
                ORDER BY e."criado_em" DESC
            `

            // Processamento manual no JS para garantir tipos Number e cálculo de profit correto
            const strategies = raw.map(s => {
                const total_entradas = Number(s.total_entradas || 0)
                const greens = Number(s.greens || 0)
                const reds = Number(s.reds || 0)
                const pendentes = Number(s.pendentes || 0)
                const stake = Number(s.stake || 10) // Valor fixo por aposta

                // Lucro = (Soma das Odds - Quantidade de Greens) * Stake - (Quantidade de Reds * Stake)
                const profit = (Number(s.green_profit || 0) * stake) - (reds * stake)

                return {
                    ...s,
                    total_entradas,
                    greens,
                    reds,
                    pendentes,
                    stake,
                    profit: Number(profit.toFixed(2)) // Arredonda para 2 casas
                }
            })

            return strategies
        } catch (error) {
            fastify.log.error(error)
            return { success: false, error: 'Falha ao buscar estratégias' }
        }
    })

    // Criar nova estratégia
    fastify.post('/', async (request: any, reply) => {
        const { nome, regras, mercado } = request.body

        if (!nome || !regras) {
            return reply.status(400).send({ success: false, error: 'Nome e regras são obrigatórios' })
        }

        try {
            const regrasJson = JSON.stringify(regras)
            const targetMarket = mercado || 'over05ht'
            const stakeValue = Number(request.body.stake || 10.00)
            await prisma.$executeRaw`
                INSERT INTO "estrategias" ("nome", "regras", "mercado", "stake") 
                VALUES (${nome}, ${regrasJson}::jsonb, ${targetMarket}, ${stakeValue})
            `
            return { success: true }
        } catch (error) {
            fastify.log.error(error)
            return reply.status(500).send({ success: false, error: 'Falha ao salvar estratégia' })
        }
    })

    // Deletar estratégia
    fastify.delete('/:id', async (request: any, reply) => {
        const { id } = request.params
        try {
            await prisma.$executeRaw`DELETE FROM "estrategias" WHERE "id" = ${id}`
            const entriesCount = await prisma.$executeRaw`DELETE FROM "entradas" WHERE "estrategia_id" = ${id}`
            return { success: true }
        } catch (error) {
            return reply.status(500).send({ success: false, error: 'Erro ao deletar' })
        }
    })

    // Editar Estratégia (PATCH/PUT)
    // Usamos caminhos explícitos para evitar conflitos de 'Route Not Found'
    fastify.patch('/:id', async (request: any, reply) => {
        const { id } = request.params
        const { nome, regras, mercado, stake } = request.body
        try {
            const regrasJson = typeof regras === 'string' ? regras : JSON.stringify(regras)
            const stakeValue = Number(stake || 10.00)
            await prisma.$executeRaw`
                UPDATE "estrategias" 
                SET "nome" = ${nome}, "regras" = ${regrasJson}::jsonb, "mercado" = ${mercado}, "stake" = ${stakeValue}
                WHERE "id" = ${id}
            `
            return { success: true }
        } catch (error) {
            fastify.log.error(error)
            return reply.status(500).send({ success: false, error: 'Erro na edição' })
        }
    })

    fastify.put('/:id', async (request: any, reply) => {
        const { id } = request.params
        const { nome, regras, mercado, stake } = request.body
        try {
            const regrasJson = typeof regras === 'string' ? regras : JSON.stringify(regras)
            const stakeValue = Number(stake || 10.00)
            await prisma.$executeRaw`
                UPDATE "estrategias" 
                SET "nome" = ${nome}, "regras" = ${regrasJson}::jsonb, "mercado" = ${mercado}, "stake" = ${stakeValue}
                WHERE "id" = ${id}
            `
            return { success: true }
        } catch (error) {
            fastify.log.error(error)
            return reply.status(500).send({ success: false, error: 'Erro na edição' })
        }
    })

    // Ativar/Desativar Robô (Botão do Bot)
    fastify.patch('/:id/bot', async (request: any, reply) => {
        const { id } = request.params
        const { bot_ativo } = request.body
        console.log(`[BOT_TOGGLE] Ativando ID: ${id} -> ${bot_ativo}`)
        try {
            await (prisma as any).estrategias.update({
                where: { id },
                data: { bot_ativo: !!bot_ativo }
            })
            return { success: true }
        } catch (error) {
            fastify.log.error(error)
            return reply.status(500).send({ success: false, error: 'Erro ao alternar bot' })
        }
    })
}
