
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Iniciando criação da tabela "entradas"...')

    try {
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "entradas" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "jogo_id" TEXT NOT NULL,
        "estrategia_id" TEXT,
        "mercado" TEXT NOT NULL,
        "odd_entrada" DECIMAL(6,2) NOT NULL,
        "placar_momento" TEXT NOT NULL,
        "tempo_momento" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDENTE',
        "contexto_stats" JSONB NOT NULL,
        "placar_final" TEXT,
        "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

        console.log('✅ Tabela "entradas" criada com sucesso!')

    } catch (error) {
        console.error('❌ Erro ao criar tabela:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
