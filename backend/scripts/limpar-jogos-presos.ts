
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 [CLEANUP] Iniciando limpeza de jogos travados...')

    try {
        // Finalizar o jogo específico que o usuário reportou (Vissel Kobe)
        const idVissel = '11248372'
        const resultVissel = await prisma.$executeRaw`
            UPDATE "jogos" 
            SET "status" = 'FINALIZADO' 
            WHERE "id" = ${idVissel}
        `
        console.log(`✅ Jogo Vissel Kobe (${idVissel}) finalizado: ${resultVissel} linha(s) afetada(s)`)

        // Finalizar outros jogos que não recebem snapshots há mais de 2 horas
        // Usamos um intervalo de 2 horas para garantir que não fechemos um jogo que apenas teve atraso de dados
        const resultGeral = await prisma.$executeRaw`
            UPDATE "jogos" 
            SET "status" = 'FINALIZADO' 
            WHERE "status" = 'AO_VIVO' 
            AND "id" NOT IN (
                SELECT DISTINCT(jogo_id) 
                FROM "snapshots" 
                WHERE "capturado_em" > NOW() - INTERVAL '2 hours'
            )
        `
        console.log(`✅ Limpeza geral concluída: ${resultGeral} outros jogos finalizados.`)

    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
