
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { NotificacaoService } from '../services/notificacao.service';

const prisma = new PrismaClient();

export async function configRoutes(fastify: FastifyInstance) {
    // GET /api/config/telegram
    fastify.get('/telegram', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const data = await prisma.$queryRawUnsafe<any>(`SELECT "chave", "valor" FROM "configuracoes" WHERE "chave" IN ('telegram_token', 'telegram_chat_id')`);
            const config: any = {};
            data.forEach((row: any) => {
                config[row.chave] = row.valor;
            });
            return { success: true, config };
        } catch (err: any) {
            return reply.code(500).send({ success: false, error: err.message });
        }
    });

    // POST /api/config/telegram
    fastify.post('/telegram', async (request: FastifyRequest, reply: FastifyReply) => {
        const { token, chatId } = request.body as any;
        try {
            await prisma.$executeRawUnsafe(`UPDATE "configuracoes" SET "valor" = ${token ? `'${token}'` : 'NULL'} WHERE "chave" = 'telegram_token'`);
            await prisma.$executeRawUnsafe(`UPDATE "configuracoes" SET "valor" = ${chatId ? `'${chatId}'` : 'NULL'} WHERE "chave" = 'telegram_chat_id'`);
            return { success: true };
        } catch (err: any) {
            return reply.code(500).send({ success: false, error: err.message });
        }
    });

    // POST /api/config/telegram/test
    fastify.post('/telegram/test', async (request: FastifyRequest, reply: FastifyReply) => {
        const { token, chatId } = request.body as any;
        try {
            if (!token || !chatId) {
                return reply.code(400).send({ success: false, error: 'Token e Chat ID são obrigatórios para o teste.' });
            }
            await NotificacaoService.enviarMensagemTeste(token, chatId);
            return { success: true };
        } catch (err: any) {
            return reply.code(500).send({ success: false, error: 'Falha ao conectar no Telegram. Verifique se o Bot foi adicionado ao grupo/canal e se o Token/Chat ID estão corretos.' });
        }
    });
}
