(function () {
    console.clear();
    console.log("%c🔥 BOT BLAZE DOUBLE - JS STYLE INICIADO", "color: lime; font-weight: bold;");

    const historico = [];
    const maxHistorico = 30;
    let ultimaLeitura = null;
    let aguardandoResultado = false;
    let sinalAtual = null;
    let martingaleAtivo = false;

    function extrairResultado() {
        const bolas = document.querySelectorAll('.entry');
        if (!bolas || bolas.length === 0) return;

        const nova = bolas[bolas.length - 1];
        const tx = nova.style.transform;
        if (tx === ultimaLeitura) return;
        ultimaLeitura = tx;

        const corClass = nova.classList.value;
        let cor = corClass.includes("white") ? "branco" :
                  corClass.includes("red") ? "vermelho" :
                  corClass.includes("black") ? "preto" : "desconhecido";

        const numeroSpan = nova.querySelector("span");
        const numero = numeroSpan ? numeroSpan.textContent.trim() : "?";

        historico.push({ numero, cor });
        if (historico.length > maxHistorico) historico.shift();

        console.log(`🎯 Novo resultado: %c${numero} (${cor})`, `color:${cor}; font-weight:bold;`);
        processarResultado(cor);
    }

    function processarResultado(cor) {
        if (aguardandoResultado && sinalAtual) {
            if (cor === "branco") {
                console.log("%c⚪ BRANCO! Lucro Máximo!", "color: gold; font-weight: bold;");
                aguardandoResultado = false;
                martingaleAtivo = false;
            } else if (cor === sinalAtual) {
                console.log(`%c✅ Acerto no ${cor}!`, "color: lime; font-weight: bold;");
                aguardandoResultado = false;
                martingaleAtivo = false;
            } else {
                console.log(`%c❌ Erro...`, "color: red; font-weight: bold;");
                if (!martingaleAtivo) {
                    martingaleAtivo = true;
                    console.log("%c⚠️ Ativando Martingale", "color: orange;");
                } else {
                    martingaleAtivo = false;
                    aguardandoResultado = false;
                    console.log("%c💥 Duplo erro. Resetando...", "color: crimson;");
                }
            }
        }
    }

    function analisarEstrategia() {
        if (historico.length < 4 || aguardandoResultado) return;

        const ultimos = historico.slice(-3).map(e => e.cor);
        const padrao = ultimos.every(c => c === ultimos[0]);

        if (padrao) {
            sinalAtual = ultimos[0] === "vermelho" ? "preto" : "vermelho";
            aguardandoResultado = true;
            console.log(`🧠 Estratégia: %c${ultimos[0].toUpperCase()} ➜ ${sinalAtual.toUpperCase()}`, "color: cyan;");
            console.log(`🎯 Sinal gerado: Apostar em %c${sinalAtual.toUpperCase()}`, `color:${sinalAtual}; font-weight: bold;`);
        }
    }

    // Loop principal
    setInterval(() => {
        extrairResultado();
        analisarEstrategia();
    }, 1000);

})();
