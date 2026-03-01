
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Iniciando migração de Configurações Telegram...')

    try {
        // Criar tabela de configurações se não existir
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "configuracoes" (
        "id" SERIAL PRIMARY KEY,
        "chave" TEXT UNIQUE NOT NULL,
        "valor" TEXT,
        "atualizado_em" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Inserir chaves iniciais se não existirem
        await prisma.$executeRawUnsafe(`
      INSERT INTO "configuracoes" ("chave", "valor") 
      VALUES ('telegram_token', NULL), ('telegram_chat_id', NULL)
      ON CONFLICT ("chave") DO NOTHING;
    `);

        console.log('✅ Tabela de configurações pronta!')
    } catch (error) {
        console.error('❌ Erro na migração:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
