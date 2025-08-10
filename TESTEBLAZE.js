// ==UserScript==
// @name         Blaze Bot v4.2 - Auto Estratégia + Flash Verde
// @namespace    blaze-bot
// @version      4.2
// @description  Bot com análise automática, coleta translateX, IA e flash verde ao acertar
// @match        *://blaze.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        historicoTamanhoMax: 15,
        delayAnalise: 1500,
        limiteAproximacao: 200,
        velocidadeRoleta: 950,
        estrategias: [
            { id: "martingale", nome: "Martingale (Progressão)", ativo: true },
            { id: "alternada", nome: "Padrão Alternado", ativo: true },
            { id: "reversao", nome: "Reversão de Tendência", ativo: true },
            { id: "sequencia", nome: "Sequência Repetida", ativo: true },
            { id: "hotnumbers", nome: "Números Quentes", ativo: false },
            { id: "tendencia", nome: "Tendência Longa", ativo: true },
            { id: "tendenciaCurta", nome: "Tendência Curta", ativo: true },
            { id: "brancoPrev", nome: "Chance no Branco", ativo: false },
            { id: "contraSequencia", nome: "Contra Sequência", ativo: true },
            { id: "espelho", nome: "Padrão Espelho", ativo: true },
            { id: "penultimo", nome: "Penúltima Cor", ativo: true },
        ],
        cores: {
            branco: { bg: "#FFFFFF", text: "#000000" },
            vermelho: { bg: "#E53935", text: "#FFFFFF" },
            preto: { bg: "#212121", text: "#FFFFFF" }
        }
    };

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
        }
    };

    function extrairTranslateX(style) {
        const regex = /translateX\((-?\d+\.?\d*)px\)/;
        const match = style.match(regex);
        return match ? match[1] : null;
    }

    function acharMaisProximo(tx) {
        const txNum = parseFloat(tx);
        let maisProximo = null;
        let menorDist = Infinity;
        for (const key in STATE.baseTranslateXMap) {
            const keyNum = parseFloat(key);
            const dist = Math.abs(keyNum - txNum);
            if (dist < menorDist) {
                menorDist = dist;
                maisProximo = key;
            }
        }
        return { key: maisProximo, diff: menorDist };
    }

    function salvarNovoTranslateX(tx) {
        let desconhecidos = JSON.parse(localStorage.getItem('translateX_desconhecidos') || '[]');
        if (!desconhecidos.includes(tx)) {
            desconhecidos.push(tx);
            localStorage.setItem('translateX_desconhecidos', JSON.stringify(desconhecidos));
            console.log('[Novo translateX desconhecido salvo]', tx);
        }
    }

    function adicionarAoMapa(tx, info) {
        STATE.baseTranslateXMap[tx] = info;
    }

    function monitorarRoleta() {
        const slider = document.getElementById('roulette-slider-entries');
        if (!slider) {
            console.warn('Elemento #roulette-slider-entries não encontrado');
            setTimeout(monitorarRoleta, 2000);
            return;
        }

        slider.style.transition = `transform ${CONFIG.velocidadeRoleta}ms ease-out`;

        let ultimoTx = null;
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'style') {
                    const style = mutation.target.style.transform;
                    const tx = extrairTranslateX(style);
                    if (!tx || tx === ultimoTx) return;
                    ultimoTx = tx;

                    if (STATE.baseTranslateXMap[tx]) {
                        const r = STATE.baseTranslateXMap[tx];
                        processarResultado(r.numero, r.cor);
                    } else {
                        const { key, diff } = acharMaisProximo(tx);
                        if (diff <= CONFIG.limiteAproximacao) {
                            const r = STATE.baseTranslateXMap[key];
                            processarResultado(r.numero, r.cor);
                            adicionarAoMapa(tx, r);
                            console.log(`[Aprendido] translateX ${tx} ≈ ${key} (diff ${diff})`);
                        } else {
                            console.log(`Desconhecido (translateX: ${tx}), salvo.`);
                            salvarNovoTranslateX(tx);
                        }
                    }
                }
            }
        });

        observer.observe(slider, { attributes: true });
    }

    function processarResultado(numero, cor) {
        const ultimo = STATE.historico[STATE.historico.length - 1];
        if (!ultimo || ultimo.numero !== numero) {
            STATE.historico.push({ numero, cor });
            if (STATE.historico.length > CONFIG.historicoTamanhoMax) STATE.historico.shift();
            UI.atualizarHistorico();

            if (STATE.aguardandoResultado && STATE.sinalAtual) {
                if (cor === "branco") {
                    STATE.estatisticas.acertos++;
                    STATE.estatisticas.branco++;
                    UI.mostrarEfeitoVitoria();
                    UI.atualizarStatus(`🎯 Caiu BRANCO! Vitória automática!`, "sucesso");
                    STATE.martingaleAtivo = false;
                } else if (STATE.sinalAtual === cor) {
                    STATE.estatisticas.acertos++;
                    UI.mostrarEfeitoVitoria();
                    UI.atualizarStatus(`✅ Acertou com ${cor.toUpperCase()}!`, "sucesso");
                    STATE.martingaleAtivo = false;
                } else {
                    if (!STATE.martingaleAtivo) {
                        STATE.martingaleAtivo = true;
                        UI.mostrarAnimacao2x();
                        UI.atualizarStatus(`❌ Errou ${cor.toUpperCase()}. Ativando MARTINGALE!`, "alerta");
                    } else {
                        STATE.estatisticas.erros++;
                        UI.atualizarStatus(`❌ Errou novamente ${cor.toUpperCase()}.`, "erro");
                        STATE.martingaleAtivo = false;
                    }
                }

                if (!STATE.martingaleAtivo) {
                    STATE.sinalAtual = null;
                    STATE.aguardandoResultado = false;
                    UI.atualizarEstatisticas();
                }
            }
        }
    }

    const BOT = {
        analisarEstrategias() {
            if (STATE.historico.length < 3) {
                UI.atualizarStatus("Aguardando mais dados...", "info");
                return;
            }

            for (const estrategia of CONFIG.estrategias) {
                if (estrategia.ativo) {
                    const cor = this[`estrategia_${estrategia.id}`]();
                    if (cor) {
                        STATE.sinalAtual = cor;
                        STATE.aguardandoResultado = true;
                        UI.atualizarStatus(`🎯 Apostar em ${cor.toUpperCase()} [${estrategia.nome}]`, "sucesso");
                        return;
                    }
                }
            }

            UI.atualizarStatus("Nenhum sinal encontrado nas estratégias.", "info");
        },

        estrategia_martingale() {
            const ultimas = STATE.historico.slice(-3).map(e => e.cor);
            const todasIguais = ultimas.every(c => c === ultimas[0]);
            return todasIguais ? (ultimas[0] === 'vermelho' ? 'preto' : 'vermelho') : null;
        },
        estrategia_alternada() {
            const ultimas = STATE.historico.slice(-3).map(e => e.cor);
            return (ultimas[0] !== ultimas[1] && ultimas[1] === ultimas[2]) ? ultimas[0] : null;
        },
        estrategia_reversao() {
            const ultimas = STATE.historico.slice(-4).map(e => e.cor);
            if (ultimas.every(c => c === ultimas[0])) {
                return ultimas[0] === 'vermelho' ? 'preto' : 'vermelho';
            }
            return null;
        },
        estrategia_sequencia() {
            const ultimas = STATE.historico.slice(-3);
            return ultimas.every(e => e.cor === ultimas[0].cor) ? ultimas[0].cor : null;
        },
        estrategia_contraSequencia() {
            const ultimas = STATE.historico.slice(-3);
            return ultimas.every(e => e.cor === ultimas[0].cor) ? (ultimas[0].cor === 'vermelho' ? 'preto' : 'vermelho') : null;
        },
        estrategia_espelho() {
            const h = STATE.historico;
            if (h.length < 6) return null;
            const parte1 = h.slice(-6, -3).map(e => e.cor).join(',');
            const parte2 = h.slice(-3).map(e => e.cor).join(',');
            return parte1 === parte2 ? h[h.length - 1].cor : null;
        },
        estrategia_penultimo() {
            const h = STATE.historico;
            return h.length >= 2 ? h[h.length - 2].cor : null;
        }
    };

    const UI = {
        painel: null,

        criarPainel() {
            this.painel = document.createElement("div");
            this.painel.style = `
                position: fixed;
                top: 50px;
                right: 50px;
                background: #1c1c1c;
                color: white;
                padding: 12px;
                border-radius: 12px;
                box-shadow: 0 0 10px #000;
                z-index: 9999;
                width: 300px;
                font-family: sans-serif;
            `;

            this.painel.innerHTML = `
                <h3 style="margin:0; text-align:center;">🔥 Blaze Bot v4.2</h3>
                <div style="font-size:10px; text-align:center; color:#0f0;">Velocidade: ${CONFIG.velocidadeRoleta}ms</div>
                <div id="historico" style="margin:8px 0; display:flex; flex-wrap:wrap; gap:4px;"></div>
                <div id="status" style="margin-bottom:8px;">Status: <span>Aguardando...</span></div>
                <div id="estatisticas" style="font-size:12px; margin-bottom:8px;">
                    ✅ Acertos: 0 | ❌ Erros: 0 | ⚪ Branco: 0
                </div>
                <button id="btnLimpar" style="width:100%; margin-bottom:6px;">🗑️ Limpar Histórico</button>
                <button id="btnTranslate" style="width:100%;">📜 TranslateX Desconhecidos</button>
            `;
            document.body.appendChild(this.painel);

            document.getElementById('btnLimpar').onclick = () => {
                STATE.historico = [];
                this.atualizarHistorico();
                this.atualizarStatus("Histórico limpo.", "info");
            };
            document.getElementById('btnTranslate').onclick = () => {
                const desconhecidos = localStorage.getItem('translateX_desconhecidos');
                alert(desconhecidos ? desconhecidos : "Nenhum translateX desconhecido.");
            };

            this.atualizarHistorico();
        },

        atualizarHistorico() {
            const div = this.painel.querySelector("#historico");
            div.innerHTML = "";
            STATE.historico.slice().reverse().forEach(e => {
                const el = document.createElement("div");
                el.style = `
                    width:20px;
                    height:20px;
                    background:${CONFIG.cores[e.cor].bg};
                    color:${CONFIG.cores[e.cor].text};
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    border-radius:50%;
                    font-size:10px;
                `;
                el.innerText = e.numero;
                div.appendChild(el);
            });
        },

        atualizarStatus(texto, tipo) {
            const span = this.painel.querySelector("#status span");
            span.innerText = texto;
            span.style.color = tipo === 'sucesso' ? 'lime' :
                               tipo === 'erro' ? 'red' :
                               tipo === 'alerta' ? 'yellow' :
                               'white';
        },

        atualizarEstatisticas() {
            const est = STATE.estatisticas;
            const el = this.painel.querySelector("#estatisticas");
            el.innerHTML = `✅ Acertos: ${est.acertos} | ❌ Erros: ${est.erros} | ⚪ Branco: ${est.branco}`;
        },

        mostrarEfeitoVitoria() {
            const flash = document.createElement("div");
            flash.style = `
                position: fixed;
                top: 0; left: 0;
                width: 100vw;
                height: 100vh;
                background-color: limegreen;
                opacity: 0.8;
                z-index: 99998;
                animation: flashGreen 0.4s ease-in-out 3;
                pointer-events: none;
            `;
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 1500);
        },

        mostrarAnimacao2x() {
            const efeito = document.createElement('div');
            efeito.innerText = "🔄 2ª CHANCE (MARTINGALE)";
            efeito.style = `
                position:fixed;
                top:50%;
                left:50%;
                transform:translate(-50%, -50%);
                background:yellow;
                color:black;
                font-size:24px;
                padding:16px;
                border-radius:12px;
                z-index:99999;
                box-shadow:0 0 20px yellow;
                animation:shake 0.5s;
            `;
            document.body.appendChild(efeito);
            setTimeout(() => efeito.remove(), 1200);
        }
    };

    const cssAnim = document.createElement("style");
    cssAnim.innerHTML = `
        @keyframes fadeout {
            0% {opacity:1;}
            100% {opacity:0;}
        }
        @keyframes shake {
            0% { transform: translate(-50%, -50%) translateX(0);}
            25% { transform: translate(-50%, -50%) translateX(-5px);}
            50% { transform: translate(-50%, -50%) translateX(5px);}
            75% { transform: translate(-50%, -50%) translateX(-5px);}
            100% { transform: translate(-50%, -50%) translateX(0);}
        }
        @keyframes flashGreen {
            0% {opacity: 0;}
            50% {opacity: 0.8;}
            100% {opacity: 0;}
        }
    `;
    document.head.appendChild(cssAnim);

    setTimeout(() => {
        UI.criarPainel();
        monitorarRoleta();
        UI.atualizarStatus("Bot iniciado. Monitorando roleta...", "sucesso");

        // Execução automática da análise
        setInterval(() => {
            if (!STATE.aguardandoResultado && STATE.historico.length >= 3) {
                BOT.analisarEstrategias();
            }
        }, CONFIG.delayAnalise);
    }, 3000);
})();
