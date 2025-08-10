// ==UserScript==
// @name         Blaze Bot Avançado v5.0 - Painel Térmico + IA + Martingale
// @namespace    blaze-bot-v5
// @version      5.0
// @description  Bot com painel térmico, IA, Martingale, 11 estratégias e coleta inteligente por translateX
// @author       Harpy
// @match        *://blaze.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // Configurações principais
    const CONFIG = {
        historicoTamanhoMax: 15,
        velocidadeRoleta: 950,
        limiteAproximacao: 50,  // Reduzido para maior precisão
        estrategias: [
            { id: "martingale", nome: "Martingale", ativo: true },
            { id: "alternada", nome: "Alternada", ativo: true },
            { id: "reversao", nome: "Reversão", ativo: true },
            { id: "sequencia", nome: "Sequência", ativo: true },
            { id: "contraSequencia", nome: "Contra Sequência", ativo: true },
            { id: "espelho", nome: "Espelho", ativo: true },
            { id: "penultimo", nome: "Penúltima", ativo: true },
        ],
        cores: {
            branco: { bg: "#fff", text: "#000" },
            vermelho: { bg: "#E53935", text: "#fff" },
            preto: { bg: "#212121", text: "#fff" }
        }
    };

    // Estado interno
    const STATE = {
        historico: [],
        sinalAtual: null,
        aguardandoResultado: false,
        martingaleAtivo: false,
        estatisticas: { acertos: 0, erros: 0, branco: 0 },
        baseTranslateXMap: {
            "-16850.5": { numero: 0, cor: "branco" },
            "-17682.3": { numero: 1, cor: "vermelho" },
            "-17890.2": { numero: 2, cor: "vermelho" },
            "-18098.2": { numero: 3, cor: "vermelho" },
            "-18306.1": { numero: 4, cor: "vermelho" },
            "-17058.4": { numero: 5, cor: "vermelho" },
            "-17266.4": { numero: 6, cor: "vermelho" },
            "-17474.3": { numero: 7, cor: "vermelho" },
            "-17578.3": { numero: 8, cor: "preto" },
            "-17370.4": { numero: 9, cor: "preto" },
            "-17162.4": { numero: 10, cor: "preto" },
            "-16954.5": { numero: 11, cor: "preto" },
            "-18202.2": { numero: 12, cor: "preto" },
            "-17994.2": { numero: 13, cor: "preto" },
            "-17786.3": { numero: 14, cor: "preto" }
        },
        termico: { vermelho: 0, preto: 0 }
    };

    // Utilidades
    function extrairTranslateX(style) {
        const match = style.match(/translateX\((-?\d+\.?\d*)px\)/);
        return match ? match[1] : null;
    }

    function acharMaisProximo(tx) {
        const txNum = parseFloat(tx);
        let maisProximo = null;
        let menorDist = Infinity;
        for (const key in STATE.baseTranslateXMap) {
            const dist = Math.abs(parseFloat(key) - txNum);
            if (dist < menorDist) {
                menorDist = dist;
                maisProximo = key;
            }
        }
        return { key: maisProximo, diff: menorDist };
    }

    function salvarTranslateDesconhecido(tx) {
        const desconhecidos = JSON.parse(localStorage.getItem("translateX_desconhecidos") || "[]");
        if (!desconhecidos.includes(tx)) {
            desconhecidos.push(tx);
            localStorage.setItem("translateX_desconhecidos", JSON.stringify(desconhecidos));
        }
    }

    // Monitoramento Roleta
    function monitorarRoleta() {
        const slider = document.getElementById("roulette-slider-entries");
        if (!slider) return setTimeout(monitorarRoleta, 1000);

        slider.style.transition = `transform ${CONFIG.velocidadeRoleta}ms ease-out`;

        let ultimoTx = null;
        const observer = new MutationObserver(muts => {
            for (const m of muts) {
                if (m.attributeName === "style") {
                    const tx = extrairTranslateX(m.target.style.transform);
                    if (!tx || tx === ultimoTx) return;
                    ultimoTx = tx;

                    const ref = STATE.baseTranslateXMap[tx];
                    if (ref) processarResultado(ref.numero, ref.cor);
                    else {
                        const { key, diff } = acharMaisProximo(tx);
                        if (diff <= CONFIG.limiteAproximacao) {
                            const ref = STATE.baseTranslateXMap[key];
                            STATE.baseTranslateXMap[tx] = ref;  // Cache novo valor
                            processarResultado(ref.numero, ref.cor);
                        } else {
                            salvarTranslateDesconhecido(tx);
                        }
                    }
                }
            }
        });
        observer.observe(slider, { attributes: true });
    }

    // Processa Resultado
    function processarResultado(numero, cor) {
        const ult = STATE.historico.at(-1);
        if (!ult || ult.numero !== numero) {
            STATE.historico.push({ numero, cor });
            if (STATE.historico.length > CONFIG.historicoTamanhoMax) STATE.historico.shift();

            // Painel térmico
            STATE.termico[cor]++;
            UI.atualizarHistorico();
            UI.atualizarTermico();

            if (STATE.aguardandoResultado) {
                if (cor === "branco") {
                    STATE.estatisticas.branco++;
                    STATE.estatisticas.acertos++;
                    UI.flashVerde();
                    UI.atualizarStatus("🎯 BRANCO automático!", "sucesso");
                    STATE.martingaleAtivo = false;
                } else if (cor === STATE.sinalAtual) {
                    STATE.estatisticas.acertos++;
                    UI.flashVerde();
                    UI.atualizarStatus(`✅ Acertou ${cor.toUpperCase()}`, "sucesso");
                    STATE.martingaleAtivo = false;
                } else {
                    if (!STATE.martingaleAtivo) {
                        STATE.martingaleAtivo = true;
                        UI.animacaoMartingale();
                        UI.atualizarStatus("⚠️ Ativando Martingale!", "alerta");
                    } else {
                        STATE.estatisticas.erros++;
                        UI.atualizarStatus("❌ Erro no Martingale", "erro");
                        STATE.martingaleAtivo = false;
                    }
                }

                if (!STATE.martingaleAtivo) {
                    STATE.sinalAtual = null;
                    STATE.aguardandoResultado = false;
                    UI.atualizarEstatisticas();
                    setTimeout(BOT.analisarEstrategias, 600);
                }
            }
        }
    }

    // Estratégias
    const BOT = {
        analisarEstrategias() {
            if (STATE.historico.length < 4) {
                UI.atualizarStatus("⏳ Aguardando dados suficientes...", "info");
                return;
            }

            for (const e of CONFIG.estrategias) {
                if (e.ativo) {
                    const cor = this[`estrategia_${e.id}`]();
                    if (cor) {
                        STATE.sinalAtual = cor;
                        STATE.aguardandoResultado = true;
                        UI.atualizarStatus(`🎯 Apostar em ${cor.toUpperCase()} (${e.nome})`, "sucesso");
                        return;
                    }
                }
            }

            UI.atualizarStatus("📭 Nenhuma estratégia válida", "info");
        },

        estrategia_martingale() {
            const ult = STATE.historico.slice(-3).map(x => x.cor);
            return ult.every(c => c === ult[0]) ? (ult[0] === "vermelho" ? "preto" : "vermelho") : null;
        },

        estrategia_alternada() {
            const ult = STATE.historico.slice(-3).map(x => x.cor);
            return (ult[0] !== ult[1] && ult[1] === ult[2]) ? ult[0] : null;
        },

        estrategia_reversao() {
            const ult = STATE.historico.slice(-4).map(x => x.cor);
            return ult.every(c => c === ult[0]) ? (ult[0] === "preto" ? "vermelho" : "preto") : null;
        },

        estrategia_sequencia() {
            const ult = STATE.historico.slice(-3);
            return ult.every(x => x.cor === ult[0].cor) ? ult[0].cor : null;
        },

        estrategia_contraSequencia() {
            const ult = STATE.historico.slice(-3);
            return ult.every(x => x.cor === ult[0].cor) ? (ult[0].cor === "vermelho" ? "preto" : "vermelho") : null;
        },

        estrategia_espelho() {
            const h = STATE.historico;
            if (h.length < 6) return null;
            const a = h.slice(-6, -3).map(e => e.cor).join();
            const b = h.slice(-3).map(e => e.cor).join();
            return a === b ? h.at(-1).cor : null;
        },

        estrategia_penultimo() {
            return STATE.historico.length >= 2 ? STATE.historico.at(-2).cor : null;
        }
    };

    // Interface
    const UI = {
        criarPainel() {
            const p = document.createElement("div");
            p.style = `
                position:fixed;top:50px;right:50px;
                background:#111;color:white;padding:12px;
                border-radius:10px;z-index:9999;width:300px;
                font-family:sans-serif;box-shadow:0 0 10px #000;
            `;
            p.innerHTML = `
                <h3 style="text-align:center;">🔥 Blaze Bot v5.0</h3>
                <div id="termico" style="margin-bottom:8px;">🔴 0 🔵 0</div>
                <div id="historico" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
                <div id="status" style="margin:8px 0;">Status: <span style="color:yellow">Aguardando...</span></div>
                <div id="estatisticas" style="font-size:12px;">✅ 0 | ❌ 0 | ⚪ 0</div>
                <button id="btnIniciar" style="width:100%;margin-top:6px;">🔍 Analisar</button>
            `;
            document.body.appendChild(p);

            document.getElementById("btnIniciar").onclick = BOT.analisarEstrategias;
            this.painel = p;
        },

        atualizarHistorico() {
            const box = this.painel.querySelector("#historico");
            box.innerHTML = "";
            STATE.historico.slice().reverse().forEach(e => {
                const d = document.createElement("div");
                d.style = `
                    width:20px;height:20px;border-radius:50%;
                    background:${CONFIG.cores[e.cor].bg};color:${CONFIG.cores[e.cor].text};
                    display:flex;align-items:center;justify-content:center;font-size:10px;
                `;
                d.innerText = e.numero;
                box.appendChild(d);
            });
        },

        atualizarStatus(msg, tipo) {
            const el = this.painel.querySelector("#status span");
            el.innerText = msg;
            el.style.color = tipo === "sucesso" ? "lime" : tipo === "erro" ? "red" : tipo === "alerta" ? "orange" : "white";
        },

        atualizarEstatisticas() {
            const { acertos, erros, branco } = STATE.estatisticas;
            this.painel.querySelector("#estatisticas").innerText = `✅ ${acertos} | ❌ ${erros} | ⚪ ${branco}`;
        },

        atualizarTermico() {
            const { vermelho, preto } = STATE.termico;
            this.painel.querySelector("#termico").innerText = `🔴 ${vermelho} 🔵 ${preto}`;
        },

        flashVerde() {
            const g = document.createElement("div");
            g.style = `
                position:fixed;top:0;left:0;width:100%;height:100%;
                background:lime;opacity:0.5;z-index:9998;
                animation:greenFlash 0.5s ease-in-out;
            `;
            document.body.appendChild(g);
            setTimeout(() => g.remove(), 500);
        },

        animacaoMartingale() {
            const m = document.createElement("div");
            m.innerText = "⚠️ MARTINGALE!";
            m.style = `
                position:fixed;top:50%;left:50%;
                transform:translate(-50%,-50%);
                background:yellow;color:black;
                font-size:24px;padding:12px;border-radius:10px;
                box-shadow:0 0 10px yellow;z-index:99999;
            `;
            document.body.appendChild(m);
            setTimeout(() => m.remove(), 1200);
        }
    };

    // CSS animação
    const estilo = document.createElement("style");
    estilo.innerHTML = `
    @keyframes greenFlash {
        0% {opacity:0.5;}
        100% {opacity:0;}
    }`;
    document.head.appendChild(estilo);

    // Inicialização
    setTimeout(() => {
        UI.criarPainel();
        monitorarRoleta();
        UI.atualizarStatus("🟢 Bot Iniciado", "sucesso");
    }, 2500);
})();
