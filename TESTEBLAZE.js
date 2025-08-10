// ==UserScript==
// @name         Blaze Double - Coletor Avançado
// @namespace    https://github.com/Bry4nV1cent3
// @version      2.0
// @description  Coleta resultados do Blaze Double com histórico salvo e painel recolhível
// @author       Você
// @match        *://blaze.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // =========================
    // CONFIGURAÇÕES
    // =========================
    const MAX_HISTORICO = 50; // máximo de resultados salvos
    const STORAGE_KEY = "blaze_historico";
    const TOGGLE_KEY = "F7"; // tecla para abrir/fechar painel

    // =========================
    // ESTADO
    // =========================
    let historico = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const translateMap = {
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
    };

    // =========================
    // FUNÇÕES
    // =========================
    function salvarHistorico() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historico));
    }

    function adicionarResultado(numero, cor) {
        if (historico.length === 0 || historico[historico.length - 1].numero !== numero) {
            historico.push({ numero, cor, hora: new Date().toLocaleTimeString() });
            if (historico.length > MAX_HISTORICO) historico.shift();
            salvarHistorico();
            atualizarPainel();
        }
    }

    function extrairTranslateX(style) {
        const match = style.match(/translateX\((-?\d+\.?\d*)px\)/);
        return match ? match[1] : null;
    }

    function acharMaisProximo(tx) {
        const txNum = parseFloat(tx);
        let maisProximo = null;
        let menorDist = Infinity;
        for (const key in translateMap) {
            const dist = Math.abs(parseFloat(key) - txNum);
            if (dist < menorDist) {
                menorDist = dist;
                maisProximo = key;
            }
        }
        return { key: maisProximo, diff: menorDist };
    }

    function monitorarRoleta() {
        const slider = document.getElementById("roulette-slider-entries");
        if (!slider) {
            console.warn("[BlazeBot] Slider não encontrado, tentando novamente...");
            setTimeout(monitorarRoleta, 2000);
            return;
        }

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.attributeName === "style") {
                    const tx = extrairTranslateX(mutation.target.style.transform);
                    if (!tx) return;

                    let resultado = translateMap[tx];
                    if (!resultado) {
                        const { key, diff } = acharMaisProximo(tx);
                        if (diff <= 200) {
                            resultado = translateMap[key];
                            translateMap[tx] = resultado; // aprendizado automático
                        }
                    }
                    if (resultado) {
                        adicionarResultado(resultado.numero, resultado.cor);
                    }
                }
            }
        });

        observer.observe(slider, { attributes: true });
        console.log("[BlazeBot] Monitoramento iniciado!");
    }

    // =========================
    // PAINEL
    // =========================
    let painel;
    function criarPainel() {
        painel = document.createElement("div");
        painel.style = `
            position: fixed; top: 50px; right: 50px;
            background: #111; color: white;
            padding: 10px; border-radius: 8px;
            font-family: sans-serif; font-size: 14px;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            z-index: 99999;
        `;
        painel.innerHTML = `<h3 style="margin:0 0 10px 0;">Blaze Double - Histórico</h3>
            <div id="listaResultados"></div>
            <small>Pressione ${TOGGLE_KEY} para abrir/fechar</small>`;
        document.body.appendChild(painel);
        atualizarPainel();
    }

    function atualizarPainel() {
        if (!painel) return;
        const lista = painel.querySelector("#listaResultados");
        lista.innerHTML = historico.slice().reverse().map(e =>
            `<div style="display:flex;align-items:center;gap:6px;">
                <div style="width:14px;height:14px;border-radius:50%;background:${e.cor};"></div>
                <span>${e.numero}</span> <small>${e.hora}</small>
            </div>`
        ).join("");
    }

    function togglePainel() {
        if (painel.style.display === "none") {
            painel.style.display = "block";
        } else {
            painel.style.display = "none";
        }
    }

    document.addEventListener("keydown", e => {
        if (e.key.toUpperCase() === TOGGLE_KEY) {
            togglePainel();
        }
    });

    // =========================
    // INICIALIZAÇÃO
    // =========================
    criarPainel();
    monitorarRoleta();
})();
