
import prisma from './prisma'
import { NotificacaoService } from './services/notificacao.service'

export async function runBotEngine() {
    console.log('🤖 [BOT] Verificando oportunidades...')

    try {
        // 1. Pegar estratégias que estão com o BOT ativado
        const estrategias: any[] = await prisma.$queryRaw`SELECT * FROM "estrategias" WHERE "bot_ativo" = true`

        if (estrategias.length === 0) return

        // 2. Pegar jogos que estão acontecendo AGORA (Status AO_VIVO recente ou com dados)
        const jogos: any[] = await prisma.$queryRaw`
            SELECT j.*, 
            (SELECT row_to_json(s) FROM "snapshots" s WHERE s.jogo_id = j.id ORDER BY s.capturado_em DESC LIMIT 1) as snapshot
            FROM "jogos" j
            WHERE j.status IN ('AO_VIVO', 'IN_PLAY')
            AND (
                j.criado_em > NOW() - INTERVAL '15 minutes'
                OR EXISTS (
                    SELECT 1 FROM "snapshots" s 
                    WHERE s.jogo_id = j.id 
                    AND s.capturado_em > NOW() - INTERVAL '10 minutes'
                )
            )
        `

        console.log(`🤖 [BOT] Analisando ${jogos.length} jogos com ${estrategias.length} estratégias ativas...`)

        for (const jogo of jogos) {
            if (!jogo.snapshot) continue
            const snap = jogo.snapshot
            // Se houver snapshots, o Prisma pode retornar como array, pegamos o primeiro se for o caso
            const s = Array.isArray(snap) ? snap[0] : snap

            for (const est of estrategias) {
                // Converter regras de string para array se necessário
                const regras = typeof est.regras === 'string' ? JSON.parse(est.regras) : est.regras

                // 3. Verificar se o BOT já entrou nesse jogo com essa estratégia (Evitar duplicidade)
                const jaEntrou: any[] = await prisma.$queryRaw`
                    SELECT id FROM "entradas" 
                    WHERE "jogo_id" = ${jogo.id} AND "estrategia_id" = ${est.id}
                    LIMIT 1
                `
                if (jaEntrou.length > 0) {
                    // console.log(`⏩ [BOT] Skip: ${jogo.time_casa} já possui entrada para ${est.nome}`)
                    continue
                }

                // 4. Aplicar regras da estratégia
                const bateuRegras = regras.every((f: any) => {
                    let valJ = 0
                    // Métricas Live (do Snapshot)
                    if (f.metric === 'pi1_total') valJ = Number(s.pi1_casa || 0) + Number(s.pi1_visitante || 0)
                    if (f.metric === 'pi2_total') valJ = Number(s.pi2_casa || 0) + Number(s.pi2_visitante || 0)
                    if (f.metric === 'pi3_total') valJ = Number(s.pi3_casa || 0) + Number(s.pi3_visitante || 0)
                    if (f.metric === 'appm_total') valJ = Number(s.appm_casa || 0) + Number(s.appm_visitante || 0)
                    if (f.metric === 'appm10_total') valJ = Number(s.appm10_casa || 0) + Number(s.appm10_visitante || 0)
                    if (f.metric === 'cg_total') valJ = Number(s.cg_casa || 0) + Number(s.cg_visitante || 0)
                    if (f.metric === 'cg10_total') valJ = Number(s.cg10_casa || 0) + Number(s.cg10_visitante || 0)
                    if (f.metric === 'xg_total') valJ = Number(s.xg_casa || 0) + Number(s.xg_visitante || 0)
                    if (f.metric === 'chutes_total') valJ = Number(s.total_chutes_casa || 0) + Number(s.total_chutes_visitante || 0)
                    if (f.metric === 'chutes_ao_gol_total') valJ = Number(s.chutes_ao_gol_casa || 0) + Number(s.chutes_ao_gol_visitante || 0)
                    if (f.metric === 'tempo') valJ = Number(s.tempo || 0)
                    if (f.metric === 'cantos_total') valJ = Number(s.cantos_casa || 0) + Number(s.cantos_visitante || 0)
                    if (f.metric === 'placar_total') valJ = Number(s.placar_casa || 0) + Number(s.placar_visitante || 0)

                    // Odds Live
                    if (f.metric === 'odd_casa_live') valJ = Number(s.odds_casa_live || 0)
                    if (f.metric === 'odd_visit_live') valJ = Number(s.odds_visitante_live || 0)
                    if (f.metric === 'odd_empate_live') valJ = Number(s.odds_empate_live || 0)
                    if (f.metric === 'odd_ht05_live') valJ = Number(s.odds_over_05_ht_live || 0)
                    if (f.metric === 'odd_ov15_live') valJ = Number(s.odds_over_15_live || 0)
                    if (f.metric === 'odd_ov25_live') valJ = Number(s.odds_over_25_live || 0)

                    // Métricas Pré-Jogo (do Jogo)
                    if (f.metric === 'odd_casa_pre') valJ = Number(jogo.odds_casa_pre || 0)
                    if (f.metric === 'odd_visit_pre') valJ = Number(jogo.odds_visitante_pre || 0)
                    if (f.metric === 'odd_ov25_pre') valJ = Number(jogo.odds_over_25_pre || 0)
                    if (f.metric === 'odd_ht05_pre') valJ = Number(jogo.odds_over_05_ht_pre || 0)

                    let pass = false
                    if (f.op === '>=') pass = valJ >= Number(f.val)
                    else if (f.op === '<=') pass = valJ <= Number(f.val)
                    else if (f.op === '==') pass = valJ === Number(f.val)

                    // if (!pass) console.log(`   ❌ Regra falhou: ${f.metric} (${valJ}) ${f.op} ${f.val}`)
                    return pass
                })

                if (bateuRegras) {
                    console.log(`🎯 [BOT] OPORTUNIDADE! Jogo: ${jogo.time_casa} x ${jogo.time_visitante} | Estratégia: ${est.nome}`)

                    // 5. Registrar entrada automática
                    const marketMap: any = {
                        'casa': 'odds_casa_live',
                        'visitante': 'odds_visitante_live',
                        'empate': 'odds_empate_live',
                        'over05ht': 'odds_over_05_ht_live',
                        'over15': 'odds_over_15_live',
                        'over25': 'odds_over_25_live',
                        'btts': 'odds_btts_sim_live'
                    }

                    const oddField = marketMap[est.mercado] || 'odds_over_05_ht_live'
                    const oddValue = (s[oddField] || 0)
                    const placar_momento = `${s.placar_casa}-${s.placar_visitante}`
                    const tempo_momento = s.tempo
                    const contexto_stats = JSON.stringify(s)

                    await prisma.$executeRaw`
                        INSERT INTO "entradas" 
                        ("jogo_id", "estrategia_id", "mercado", "odd_entrada", "placar_momento", "tempo_momento", "contexto_stats", "status") 
                        VALUES 
                        (${jogo.id}, ${est.id}, ${est.mercado}, ${oddValue}, ${placar_momento}, ${tempo_momento}, ${contexto_stats}::jsonb, 'BOT')
                    `
                    console.log(`✅ [BOT] Entrada registrada com sucesso para ${jogo.time_casa}`)

                    // --- DISPARAR ALERTA TELEGRAM (BOT AUTOMÁTICO) ---
                    try {
                        console.log(`📡 [BOT-ALERTA] Preparando sinal para ${jogo.time_casa} @ ${oddValue}...`);
                        await NotificacaoService.enviarAlerta({
                            time_casa: jogo.time_casa,
                            time_visitante: jogo.time_visitante,
                            mercado: est.mercado,
                            odd_entrada: oddValue,
                            tempo_momento: tempo_momento,
                            estrategia_nome: est.nome,
                            link_betfair: jogo.link_betfair
                        });
                        console.log(`✅ [BOT-ALERTA] Sinal processado para ${jogo.time_casa}`);
                    } catch (err) {
                        console.error('❌ [BOT-ALERTA] Falha crítica ao enviar sinal:', err);
                    }
                }
            }
        }
        // 6. Atualizar resultados de entradas pendentes
        await updatePendingResults()

    } catch (error) {
        console.error('❌ [BOT] Erro no motor:', error)
    }
}

async function updatePendingResults() {
    try {
        // Pegar entradas que ainda não foram resolvidas
        const pendentes: any[] = await prisma.$queryRaw`
            SELECT e.*, j.status as jogo_status
            FROM "entradas" e
            JOIN "jogos" j ON e.jogo_id = j.id
            WHERE e.status = 'BOT' OR e.status = 'PENDENTE'
        `

        if (pendentes.length === 0) return

        console.log(`🔍 [BOT] Verificando resultados de ${pendentes.length} entradas pendentes...`)

        for (const e of pendentes) {
            // Pegar o último snapshot disponível desse jogo
            const snapshots: any[] = await prisma.$queryRaw`
                SELECT * FROM "snapshots" WHERE "jogo_id" = ${e.jogo_id} ORDER BY "capturado_em" DESC LIMIT 1
            `
            if (snapshots.length === 0) continue
            const snap = snapshots[0]

            // Extrair placar do momento da entrada
            const [golsCasaE, golsVisE] = e.placar_momento.split('-').map(Number)
            const golsTotalE = golsCasaE + golsVisE

            // Placar atual/final
            const golsTotalAtual = snap.placar_casa + snap.placar_visitante
            let novoStatus = null

            // LÓGICA POR MERCADO
            if (e.mercado === 'over05ht') {
                // GREEN se saiu gol no HT
                if (golsTotalAtual > golsTotalE && snap.tempo <= 45) {
                    novoStatus = 'GREEN'
                }
                // RED se passou do HT e não saiu gol
                else if (snap.tempo > 45 || e.jogo_status === 'FINALIZADO') {
                    if (golsTotalAtual <= golsTotalE) novoStatus = 'RED'
                }
            }
            else if (e.mercado === 'over15') {
                if (golsTotalAtual >= 2) novoStatus = 'GREEN'
                else if (e.jogo_status === 'FINALIZADO') novoStatus = 'RED'
            }
            else if (e.mercado === 'over25') {
                if (golsTotalAtual >= 3) novoStatus = 'GREEN'
                else if (e.jogo_status === 'FINALIZADO') novoStatus = 'RED'
            }
            // ... outras lógicas podem ser adicionadas aqui

            if (novoStatus) {
                console.log(`📊 [BOT] Resultado: ${e.mercado} | Jogo ID: ${e.jogo_id} | PLACAR: ${snap.placar_casa}-${snap.placar_visitante} | STATUS: ${novoStatus}`)
                await prisma.$executeRaw`
                    UPDATE "entradas" 
                    SET "status" = ${novoStatus}, "placar_final" = ${snap.placar_casa + '-' + snap.placar_visitante} 
                    WHERE "id" = ${e.id}
                `
            }
        }
    } catch (error) {
        console.error('❌ [BOT] Erro ao atualizar resultados:', error)
    }
}
