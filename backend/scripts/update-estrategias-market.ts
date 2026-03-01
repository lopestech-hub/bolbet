
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Adicionando coluna "mercado" à tabela "estrategias"...')

    try {
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "estrategias" ADD COLUMN IF NOT EXISTS "mercado" TEXT DEFAULT 'over05ht';
    `)
        console.log('✅ Coluna "mercado" adicionada!')
    } catch (error) {
        console.error('❌ Erro:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
