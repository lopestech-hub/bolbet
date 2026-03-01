
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificacaoService {
    private static async getConfig() {
        const token: any[] = await prisma.$queryRawUnsafe<any>(`SELECT "valor" FROM "configuracoes" WHERE "chave" = 'telegram_token'`);
        const chatId: any[] = await prisma.$queryRawUnsafe<any>(`SELECT "valor" FROM "configuracoes" WHERE "chave" = 'telegram_chat_id'`);

        const config = {
            token: token?.[0]?.valor,
            chatId: chatId?.[0]?.valor
        };

        if (!config.token) console.log('🔴 NotificacaoService: Token Telegram não encontrado no banco.');
        if (!config.chatId) console.log('🔴 NotificacaoService: Chat ID Telegram não encontrado no banco.');

        return config;
    }

    static async enviarAlerta(entrada: any) {
        const config = await this.getConfig();

        if (!config.token || !config.chatId) {
            console.log('⚠️ Alerta Telegram não enviado: Configuração faltando (Token ou Chat ID)');
            return;
        }

        const mensagem = `
🚨 *NOVA ENTRADA IDENTIFICADA!* 🤖

⚽ *Times:* ${entrada.time_casa} vs ${entrada.time_visitante}
📈 *Mercado:* ${entrada.mercado}
📊 *Odd:* ${Number(entrada.odd_entrada).toFixed(2)}
⏰ *Tempo:* ${entrada.tempo_momento}'
🤖 *Estratégia:* ${entrada.estrategia_nome || 'Auto-Bot'}

🔗 [Abrir na Betfair](https://www.betfair.bet.br/exchange/plus/football/event/${entrada.link_betfair || ''})
        `.trim();

        try {
            await axios.post(`https://api.telegram.org/bot${config.token}/sendMessage`, {
                chat_id: config.chatId,
                text: mensagem,
                parse_mode: 'Markdown'
            });
            console.log(`✅ Alerta Telegram enviado para o canal: ${config.chatId}`);
        } catch (err: any) {
            console.error('❌ Erro da API do Telegram:', err.response?.data || err.message);
        }
    }

    static async enviarMensagemTeste(token: string, chatId: string) {
        const mensagem = `✅ *CONEXÃO ESTABELECIDA!* \n\nO sistema Bolbet Trading Bot está pronto para enviar seus alertas agora. 🎉💎🦾`;
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: mensagem,
            parse_mode: 'Markdown'
        });
    }
}
