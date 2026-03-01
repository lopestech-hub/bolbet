
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Adicionando coluna stake na tabela estrategias...')

    try {
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "estrategias" 
      ADD COLUMN IF NOT EXISTS "stake" DECIMAL(10,2) DEFAULT 10.00;
    `)
        console.log('✅ Coluna stake adicionada com sucesso!')
    } catch (error) {
        console.error('❌ Erro ao adicionar coluna:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
