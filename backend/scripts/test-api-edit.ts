
async function testEdit() {
    const API_URL = 'http://localhost:3000/api';
    try {
        // 1. Get strategies
        const res = await fetch(`${API_URL}/estrategias`);
        const strategies: any = await res.json();

        if (!Array.isArray(strategies) || strategies.length === 0) {
            console.log('No strategies found or error fetching.');
            return;
        }

        const strategy = strategies[0];
        console.log(`Testing edit for strategy: ${strategy.nome} (${strategy.id})`);

        // 2. Try to update it
        const updateRes = await fetch(`${API_URL}/estrategias/${strategy.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: strategy.nome + '_TESTED',
                regras: strategy.regras,
                mercado: strategy.mercado || 'over05ht'
            })
        });

        const updateData: any = await updateRes.json();
        console.log('Update result:', updateData);

        // 3. Verify
        const verifyRes = await fetch(`${API_URL}/estrategias`);
        const updated: any = (await verifyRes.json() as any[]).find((s: any) => s.id === strategy.id);
        console.log('Updated strategy name:', updated?.nome);

        // 4. Revert
        await fetch(`${API_URL}/estrategias/${strategy.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: strategy.nome,
                regras: strategy.regras,
                mercado: strategy.mercado || 'over05ht'
            })
        });
        console.log('Reverted changes.');

    } catch (error: any) {
        console.error('Error during test:', error.message);
    }
}

testEdit();
