
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Calibrando coluna "bot_ativo" para registros existentes...')

    try {
        const result = await prisma.$executeRawUnsafe(`
      UPDATE "estrategias" SET "bot_ativo" = false WHERE "bot_ativo" IS NULL;
    `)
        console.log(`✅ ${result} estratégias calibradas com bot_ativo = false!`)
    } catch (error) {
        console.error('❌ Erro:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
