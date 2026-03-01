
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Iniciando criação da tabela "estrategias"...')

    try {
        // DDL para criar a tabela estrategias
        // Usamos JSONB para as regras para máxima performance e flexibilidade
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "estrategias" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "nome" TEXT NOT NULL,
        "regras" JSONB NOT NULL,
        "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

        console.log('✅ Tabela "estrategias" criada com sucesso!')

        // Lista as tabelas para confirmar
        const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
        console.log('📊 Tabelas atuais no banco:', tables.map(t => t.table_name).join(', '))

    } catch (error) {
        console.error('❌ Erro ao criar tabela:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
