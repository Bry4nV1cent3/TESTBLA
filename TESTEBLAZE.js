// ==UserScript==
// @name         Blaze Bot v4.3 - Auto Estratégia + Flash Verde
// @namespace    blaze-bot
// @version      4.3
// @description  Bot com análise automática, coleta translateX, IA e flash verde ao acertar
// @match        *://blaze.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Configurações globais do bot
     * @type {Object}
     */
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

    /**
     * Estado global do aplicativo
     * @type {Object}
     */
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
        elementos: {
            slider: null,
            painel: null,
            historico: null,
            status: null,
            estatisticas: null
        }
    };

    /**
     * Extrai valor translateX de string de estilo
     * @param {string} style - String de estilo CSS
     * @returns {string|null} Valor do translateX ou null
     */
    function extrairTranslateX(style) {
        try {
            const regex = /translateX\((-?\d+\.?\d*)px\)/;
            const match = style.match(regex);
            return match ? match[1] : null;
        } catch (error) {
            console.error('Erro ao extrair translateX:', error);
            return null;
        }
    }

    /**
     * Encontra o valor mais próximo no mapa de translateX
     * @param {string} tx - Valor translateX a ser comparado
     * @returns {Object} { key: string, diff: number }
     */
    function acharMaisProximo(tx) {
        try {
            const txNum = parseFloat(tx);
            let maisProximo = null;
            let menorDist = Infinity;
            
            Object.keys(STATE.baseTranslateXMap).forEach(key => {
                const keyNum = parseFloat(key);
                const dist = Math.abs(keyNum - txNum);
                if (dist < menorDist) {
                    menorDist = dist;
                    maisProximo = key;
                }
            });
            
            return { key: maisProximo, diff: menorDist };
        } catch (error) {
            console.error('Erro ao encontrar translateX mais próximo:', error);
            return { key: null, diff: Infinity };
        }
    }

    /**
     * Armazena novo valor translateX desconhecido
     * @param {string} tx - Valor translateX a ser armazenado
     */
    function salvarNovoTranslateX(tx) {
        try {
            const desconhecidos = JSON.parse(localStorage.getItem('translateX_desconhecidos') || '[]');
            if (!desconhecidos.includes(tx)) {
                desconhecidos.push(tx);
                localStorage.setItem('translateX_desconhecidos', 
                    JSON.stringify(desconhecidos));
                console.log('[Novo translateX desconhecido salvo]', tx);
            }
        } catch (error) {
            console.error('Erro ao salvar translateX:', error);
        }
    }

    /**
     * Adiciona novo mapeamento de translateX
     * @param {string} tx - Chave translateX
     * @param {Object} info - { numero: number, cor: string }
     */
    function adicionarAoMapa(tx, info) {
        try {
            STATE.baseTranslateXMap[tx] = info;
        } catch (error) {
            console.error('Erro ao adicionar ao mapa:', error);
        }
    }

    /**
     * Monitora mudanças na roleta e processa resultados
     */
    function monitorarRoleta() {
        try {
            STATE.elementos.slider = document.getElementById('roulette-slider-entries');
            if (!STATE.elementos.slider) {
                console.warn('Elemento #roulette-slider-entries não encontrado');
                setTimeout(monitorarRoleta, 2000);
                return;
            }

            STATE.elementos.slider.style.transition = `transform ${CONFIG.velocidadeRoleta}ms ease-out`;

            let ultimoTx = null;
            let debounceTimer = null;

            const observer = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if (mutation.attributeName === 'style') {
                        clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(() => {
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
                        }, 100);
                    }
                }
            });

            observer.observe(STATE.elementos.slider, { attributes: true });
        } catch (error) {
            console.error('Erro ao monitorar roleta:', error);
            setTimeout(monitorarRoleta, 2000);
        }
    }

    /**
     * Processa resultado da roleta e atualiza estado
     * @param {number} numero - Número sorteado
     * @param {string} cor - Cor sorteada
     */
    function processarResultado(numero, cor) {
        try {
            const ultimo = STATE.historico[STATE.historico.length - 1];
            if (!ultimo || ultimo.numero !== numero) {
                STATE.historico.push({ numero, cor });
                if (STATE.historico.length > CONFIG.historicoTamanhoMax) {
                    STATE.historico.shift();
                }
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
        } catch (error) {
            console.error('Erro ao processar resultado:', error);
        }
    }

    /**
     * Módulo de estratégias do bot
     */
    const BOT = {
        /**
         * Analisa histórico e aplica estratégias ativas
         */
        analisarEstrategias() {
            try {
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
            } catch (error) {
                console.error('Erro ao analisar estratégias:', error);
                UI.atualizarStatus("Erro na análise de estratégias", "erro");
            }
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
            return ultimas.every(e => e.cor === ultimas[0].cor) ? 
                (ultimas[0].cor === 'vermelho' ? 'preto' : 'vermelho') : null;
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

    /**
     * Módulo de interface do usuário
     */
    const UI = {
        /**
         * Cria painel de controle do bot
         */
        criarPainel() {
            try {
                STATE.elementos.painel = document.createElement("div");
                STATE.elementos.painel.style.cssText = `
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

                STATE.elementos.painel.innerHTML = `
                    <h3 style="margin:0; text-align:center;">🔥 Blaze Bot v4.3</h3>
                    <div style="font-size:10px; text-align:center; color:#0f0;">
                        Velocidade: ${CONFIG.velocidadeRoleta}ms
                    </div>
                    <div id="historico" style="margin:8px 0; display:flex; flex-wrap:wrap; gap:4px;"></div>
                    <div id="status" style="margin-bottom:8px;">
                        Status: <span>Aguardando...</span>
                    </div>
                    <div id="estatisticas" style="font-size:12px; margin-bottom:8px;">
                        ✅ Acertos: 0 | ❌ Erros: 0 | ⚪ Branco: 0
                    </div>
                    <button id="btnLimpar" style="width:100%; margin-bottom:6px;">
                        🗑️ Limpar Histórico
                    </button>
                    <button id="btnTranslate" style="width:100%;">
                        📜 TranslateX Desconhecidos
                    </button>
                `;
                document.body.appendChild(STATE.elementos.painel);

                STATE.elementos.historico = STATE.elementos.painel.querySelector("#historico");
                STATE.elementos.status = STATE.elementos.painel.querySelector("#status span");
                STATE.elementos.estatisticas = STATE.elementos.painel.querySelector("#estatisticas");

                document.getElementById('btnLimpar').addEventListener('click', () => {
                    STATE.historico = [];
                    this.atualizarHistorico();
                    this.atualizarStatus("Histórico limpo.", "info");
                });

                document.getElementById('btnTranslate').addEventListener('click', () => {
                    const desconhecidos = localStorage.getItem('translateX_desconhecidos');
                    alert(desconhecidos ? desconhecidos : "Nenhum translateX desconhecido.");
                });

                this.atualizarHistorico();
            } catch (error) {
                console.error('Erro ao criar painel:', error);
            }
        },

        /**
         * Atualiza exibição do histórico
         */
        atualizarHistorico() {
            try {
                STATE.elementos.historico.innerHTML = "";
                STATE.historico.slice().reverse().forEach(e => {
                    const el = document.createElement("div");
                    el.style.cssText = `
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
                    el.textContent = e.numero;
                    STATE.elementos.historico.appendChild(el);
                });
            } catch (error) {
                console.error('Erro ao atualizar histórico:', error);
            }
        },

        /**
         * Atualiza mensagem de status
         * @param {string} texto - Mensagem a ser exibida
         * @param {string} tipo - Tipo de mensagem (sucesso, erro, alerta, info)
         */
        atualizarStatus(texto, tipo) {
            try {
                STATE.elementos.status.textContent = texto;
                STATE.elementos.status.style.color = 
                    tipo === 'sucesso' ? 'lime' :
                    tipo === 'erro' ? 'red' :
                    tipo === 'alerta' ? 'yellow' :
                    'white';
            } catch (error) {
                console.error('Erro ao atualizar status:', error);
            }
        },

        /**
         * Atualiza estatísticas exibidas
         */
        atualizarEstatisticas() {
            try {
                const est = STATE.estatisticas;
                STATE.elementos.estatisticas.textContent = 
                    `✅ Acertos: ${est.acertos} | ❌ Erros: ${est.erros} | ⚪ Branco: ${est.branco}`;
            } catch (error) {
                console.error('Erro ao atualizar estatísticas:', error);
            }
        },

        /**
         * Mostra efeito visual de vitória
         */
        mostrarEfeitoVitoria() {
            try {
                const flash = document.createElement("div");
                flash.style.cssText = `
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
            } catch (error) {
                console.error('Erro ao mostrar efeito de vitória:', error);
            }
        },

        /**
         * Mostra animação de martingale ativado
         */
        mostrarAnimacao2x() {
            try {
                const efeito = document.createElement('div');
                efeito.textContent = "🔄 2ª CHANCE (MARTINGALE)";
                efeito.style.cssText = `
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
            } catch (error) {
                console.error('Erro ao mostrar animação:', error);
            }
        }
    };

    /**
     * Adiciona animações CSS necessárias
     */
    function adicionarAnimacoesCSS() {
        try {
            const cssAnim = document.createElement("style");
            cssAnim.textContent = `
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
        } catch (error) {
            console.error('Erro ao adicionar animações CSS:', error);
        }
    }

    /**
     * Inicializa o bot
     */
    function iniciarBot() {
        try {
            adicionarAnimacoesCSS();
            UI.criarPainel();
            monitorarRoleta();
            UI.atualizarStatus("Bot iniciado. Monitorando roleta...", "sucesso");

            // Execução automática da análise
            setInterval(() => {
                if (!STATE.aguardandoResultado && STATE.historico.length >= 3) {
                    BOT.analisarEstrategias();
                }
            }, CONFIG.delayAnalise);
        } catch (error) {
            console.error('Erro ao iniciar bot:', error);
        }
    }

    // Inicia o bot após 3 segundos
    setTimeout(iniciarBot, 3000);
})();
