// ==UserScript==
// @name         Blaze Double Bot Melhorado
// @namespace    https://github.com/seu-usuario
// @version      6.0
// @description  Bot de análise para Blaze Double com melhorias de estabilidade, histórico persistente e painel otimizado
// @author       Harpy
// @match        *://blaze.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /*** CONFIGURAÇÃO PRINCIPAL ***/
    const CONFIG = {
        historicoMax: 20,
        limiteAproximacao: 200,
        cores: {
            branco: { bg: "#fff", text: "#000" },
            vermelho: { bg: "#E53935", text: "#fff" },
            preto: { bg: "#212121", text: "#fff" }
        },
        githubRaw: "https://raw.githubusercontent.com/seu-usuario/seu-repo/main/blaze-bot.user.js"
    };

    /*** ESTADO GLOBAL ***/
    const STATE = {
        historico: JSON.parse(localStorage.getItem("blazeHistorico") || "[]"),
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

    /*** FUNÇÕES DE SUPORTE ***/
    function extrairTranslateX(style) {
        const match = style.match(/translateX\((-?\d+\.?\d*)px\)/);
        return match ? match[1] : null;
    }

    function acharMaisProximo(tx) {
        const txNum = parseFloat(tx);
        let maisProximo = null, menorDist = Infinity;
        for (const key in STATE.baseTranslateXMap) {
            const dist = Math.abs(parseFloat(key) - txNum);
            if (dist < menorDist) {
                menorDist = dist;
                maisProximo = key;
            }
        }
        return { key: maisProximo, diff: menorDist };
    }

    function salvarHistorico() {
        localStorage.setItem("blazeHistorico", JSON.stringify(STATE.historico));
    }

    /*** INTERFACE DO USUÁRIO ***/
    const UI = {
        painel: null,
        criarPainel() {
            this.painel = document.createElement("div");
            this.painel.id = "painelBlaze";
            this.painel.style = `
                position:fixed;top:50px;right:50px;
                background:#111;color:white;padding:12px;
                border-radius:10px;z-index:9999;width:300px;
                font-family:sans-serif;box-shadow:0 0 10px #000;
            `;
            this.painel.innerHTML = `
                <h3 style="text-align:center;">🔥 Blaze Bot 6.0</h3>
                <div id="historico" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
                <div style="margin-top:8px;font-size:12px;">Pressione F7 para ocultar</div>
            `;
            document.body.appendChild(this.painel);
            this.atualizarHistorico();
        },
        atualizarHistorico() {
            const box = this.painel.querySelector("#historico");
            box.innerHTML = "";
            STATE.historico.slice().reverse().forEach(e => {
                const d = document.createElement("div");
                d.style = `
                    width:20px;height:20px;border-radius:50%;
                    background:${CONFIG.cores[e.cor].bg};
                    color:${CONFIG.cores[e.cor].text};
                    display:flex;align-items:center;justify-content:center;font-size:10px;
                `;
                d.innerText = e.numero;
                box.appendChild(d);
            });
        }
    };

    /*** MONITORAMENTO DA ROLETA ***/
    function monitorarRoleta() {
        const slider = document.getElementById('roulette-slider-entries');
        if (!slider) return setTimeout(monitorarRoleta, 1000);

        let ultimoTx = null;
        const observer = new MutationObserver(muts => {
            for (const m of muts) {
                if (m.attributeName === 'style') {
                    const tx = extrairTranslateX(m.target.style.transform);
                    if (!tx || tx === ultimoTx) return;
                    ultimoTx = tx;

                    if (STATE.baseTranslateXMap[tx]) {
                        adicionarResultado(STATE.baseTranslateXMap[tx]);
                    } else {
                        const { key, diff } = acharMaisProximo(tx);
                        if (diff <= CONFIG.limiteAproximacao) {
                            const r = STATE.baseTranslateXMap[key];
                            STATE.baseTranslateXMap[tx] = r;
                            adicionarResultado(r);
                        }
                    }
                }
            }
        });
        observer.observe(slider, { attributes: true });
    }

    function adicionarResultado(r) {
        const ultimo = STATE.historico[STATE.historico.length - 1];
        if (!ultimo || ultimo.numero !== r.numero) {
            STATE.historico.push(r);
            if (STATE.historico.length > CONFIG.historicoMax) STATE.historico.shift();
            salvarHistorico();
            UI.atualizarHistorico();
        }
    }

    /*** TECLA DE ATALHO ***/
    document.addEventListener("keydown", e => {
        if (e.key === "F7") {
            UI.painel.style.display = (UI.painel.style.display === "none") ? "block" : "none";
        }
    });

    /*** AUTOATUALIZAÇÃO ***/
    fetch(CONFIG.githubRaw)
        .then(r => r.text())
        .then(code => {
            if (!code.includes("@version 6.0")) {
                console.warn("⚠️ Nova versão disponível no GitHub");
            }
        });

    /*** INÍCIO ***/
    setTimeout(() => {
        UI.criarPainel();
        monitorarRoleta();
    }, 2000);

})();
