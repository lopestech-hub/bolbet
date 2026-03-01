
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Adicionando coluna "bot_ativo" à tabela "estrategias"...')

    try {
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "estrategias" ADD COLUMN IF NOT EXISTS "bot_ativo" BOOLEAN DEFAULT FALSE;
    `)
        console.log('✅ Coluna "bot_ativo" adicionada!')
    } catch (error) {
        console.error('❌ Erro:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
