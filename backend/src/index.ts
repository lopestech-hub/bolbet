import 'dotenv/config'
import fastify from 'fastify'
import cors from '@fastify/cors'

// Suporte global para BigInt (Fix para erro de serialização JSON do Prisma/PostgreSQL)
(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

const server = fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true
            }
        }
    }
})

server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
})

// Log de Auditoria: Monitora todas as chegadas
server.addHook('onRequest', async (request) => {
    if (request.url.includes('/api/')) {
        console.log(`[INCOMING] ${request.method} ${request.url}`)
    }
})

// Módulos
import jogosRoutes from './modules/jogos/jogos.controller'
import estrategiasRoutes from './modules/estrategias/estrategias.controller'
import entradasRoutes from './modules/entradas/entradas.controller'
import { configRoutes } from './routes/config.routes'
import { runBotEngine } from './bot.service'

server.register(jogosRoutes, { prefix: '/api/jogos' })
server.register(estrategiasRoutes, { prefix: '/api/estrategias' })
server.register(entradasRoutes, { prefix: '/api/entradas' })
server.register(configRoutes, { prefix: '/api/config' })

server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
})

// Iniciar o motor do Bot (Vigilância 24/7)
setInterval(() => {
    runBotEngine()
}, 30000)

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000
        await server.listen({ port, host: '0.0.0.0' })
        console.log(`🚀 Servidor rodando em http://localhost:${port}`)
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start()
