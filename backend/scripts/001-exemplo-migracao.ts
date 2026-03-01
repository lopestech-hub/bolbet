import prisma from '../src/prisma'

/**
 * Script de exemplo para alteração de schema ou dados.
 * Use via: npx tsx scripts/001-exemplo-migracao.ts
 */
async function main() {
    console.log('🚀 Iniciando script de migração...')

    try {
        // Exemplo DDL: Adicionar um índice se necessário
        // await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_jogos_status ON jogos(status)`)

        // Exemplo DML: Corrigir dados se necessário
        // const result = await prisma.$executeRaw`UPDATE jogos SET status = 'FINALIZADO' WHERE status IS NULL`
        // console.log(`✅ Registros atualizados: ${result}`)

        console.log('✅ Script finalizado com sucesso.')
    } catch (error) {
        console.error('❌ Erro durante o script:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
