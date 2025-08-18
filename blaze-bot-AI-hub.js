// ==UserScript==
// @name         Blaze Bot Premium - Hub
// @namespace    https://github.com/seu-usuario
// @version      8.0
// @description  Hub de automação para Blaze Mines e Double. Inclui um algoritmo de análise de sequências.
// @author       Você
// @match        *://blaze.com/pt/games/double
// @match        *://blaze.bet.br/pt/games/double
// @match        *://blaze.com/pt/games/mines
// @match        *://blaze.bet.br/pt/games/mines
// @grant        none
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log("AVISO: O uso de bots viola os termos de serviço da Blaze e pode resultar em perdas financeiras e banimento de conta. Use com cautela e sob sua própria responsabilidade.");

    function initMinesBot() {
        const CONFIG = { apostaAutomaticaAtiva: false, valorBaseAposta: 1, numeroDeMinas: 3, clicksParaRetirar: 5, estrategiaDeCliques: [6, 7, 8, 11, 12, 13, 16, 17, 18], };
        const STATE = { aguardandoInicio: false, jogoEmAndamento: false, clicksFeitos: 0, estatisticas: { vitorias: 0, derrotas: 0 }, };
        const Acao = {
            iniciarJogo() { const betButton = document.querySelector('[data-testid="bet-button"]'); if (!betButton) { UI.updateStatus("❌ Botão de aposta não encontrado.", 'error'); return; } betButton.click(); UI.updateStatus("🚀 Jogo iniciado...", 'info'); STATE.jogoEmAndamento = true; STATE.clicksFeitos = 0; setTimeout(Acao.clicarProximo, 2000); },
            clicarProximo() { if (!STATE.jogoEmandamento) return; if (STATE.clicksFeitos >= CONFIG.clicksParaRetirar) return Acao.retirarPremio(); const mines = document.querySelectorAll('.cell.closed'); if (mines.length === 0) { UI.updateStatus("⚠️ Nenhuma célula para clicar. Aguardando novo jogo...", 'warning'); STATE.jogoEmAndamento = false; setTimeout(Acao.verificarEIniciar, 3000); return; } const indice = CONFIG.estrategiaDeCliques[STATE.clicksFeitos]; const mine = mines[indice]; if (mine) { mine.click(); STATE.clicksFeitos++; UI.updateStatus(`➡️ Clique ${STATE.clicksFeitos}/${CONFIG.clicksParaRetirar} em andamento...`, 'info'); setTimeout(Acao.clicarProximo, 1000); } else { UI.updateStatus("⚠️ Estratégia de cliques esgotada ou célula já aberta.", 'warning'); Acao.retirarPremio(); } },
            retirarPremio() { const cashoutButton = document.querySelector('.mines-cashout-button'); if (!cashoutButton) { UI.updateStatus("❌ Botão de 'Retirar' não encontrado. Jogo encerrado.", 'error'); STATE.jogoEmAndamento = false; STATE.estatisticas.derrotas++; UI.updateStats(); return setTimeout(Acao.verificarEIniciar, 3000); } cashoutButton.click(); UI.updateStatus("🏆 Prêmio retirado com sucesso!", 'win'); STATE.jogoEmAndamento = false; STATE.estatisticas.vitorias++; UI.updateStats(); setTimeout(Acao.verificarEIniciar, 3000); },
            ajustarConfiguracoes() { const minesInput = document.querySelector('[data-testid="mines-input"]'); const betInput = document.querySelector('[data-testid="bet-input"]'); if (minesInput) { minesInput.value = CONFIG.numeroDeMinas; minesInput.dispatchEvent(new Event('input', { bubbles: true })); } if (betInput) { betInput.value = CONFIG.valorBaseAposta; betInput.dispatchEvent(new Event('input', { bubbles: true })); } },
            verificarEIniciar() { if (!CONFIG.apostaAutomaticaAtiva || STATE.jogoEmAndamento) return; const betButton = document.querySelector('[data-testid="bet-button"]'); if (betButton && betButton.textContent.trim() === 'Começar o jogo') { Acao.ajustarConfiguracoes(); setTimeout(Acao.iniciarJogo, 1000); } else { setTimeout(Acao.verificarEIniciar, 1000); } }
        };
        const UI = {
            painel: null, init() { this.painel = document.createElement('div'); this.painel.style.cssText = `position: fixed; top: 20px; right: 20px; background: rgba(20, 20, 20, 0.9); color: white; padding: 15px; border-radius: 12px; width: 300px; z-index: 99999; font-family: 'Segoe UI', sans-serif; backdrop-filter: blur(5px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); cursor: move; user-select: none; transition: transform 0.3s ease-out;`; this.painel.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;"><h3 style="margin: 0; font-size: 16px; color: #FFD700;">⛏️ BLAZE BOT MINES</h3><div id="stats" style="font-size: 12px;">✅ 0 | ❌ 0</div></div><div id="status" style="padding: 8px; border-radius: 6px; background: rgba(0, 0, 0, 0.3); margin-bottom: 12px; font-size: 13px; min-height: 18px;">Status: Pronto para jogar.</div><div id="configs"><h4 style="margin: 0 0 8px 0; font-size: 14px; color: #FFD700;">Configurações</h4><div id="aposta-container" style="display: flex; flex-direction: column; gap: 8px;"><label style="display: flex; align-items: center; gap: 5px; font-size: 12px;"><input type="checkbox" id="toggleApostaAuto">Ativar Automação</label><div style="display: flex; justify-content: space-between; gap: 10px;"><div style="display: flex; flex-direction: column;"><label style="font-size: 12px;">Valor Base:</label><input type="number" id="inputValorAposta" value="${CONFIG.valorBaseAposta}" min="1" step="1" style="width: 80px; background: #333; border: 1px solid #555; color: white; padding: 5px;"></div><div style="display: flex; flex-direction: column;"><label style="font-size: 12px;">Nº de Minas:</label><input type="number" id="inputNumeroMinas" value="${CONFIG.numeroDeMinas}" min="2" max="24" step="1" style="width: 80px; background: #333; border: 1px solid #555; color: white; padding: 5px;"></div></div><div style="display: flex; flex-direction: column;"><label style="font-size: 12px;">Cliques p/ Retirar:</label><input type="number" id="inputCliquesRetirar" value="${CONFIG.clicksParaRetirar}" min="1" max="24" step="1" style="width: 100%; background: #333; border: 1px solid #555; color: white; padding: 5px;"></div></div></div>`; document.body.appendChild(this.painel); this.makeDraggable(); this.setupListeners(); },
            makeDraggable() { /* ... */ }, setupListeners() { /* ... */ }, updateStats() { /* ... */ }, updateStatus(text, type) { /* ... */ }
        };
        UI.makeDraggable = function() { const panel = this.painel; let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0; panel.onmousedown = dragMouseDown; function dragMouseDown(e) { e = e || window.event; e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = closeDragElement; document.onmousemove = elementDrag; } function elementDrag(e) { e = e || window.event; e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY; panel.style.top = (panel.offsetTop - pos2) + "px"; panel.style.right = "unset"; panel.style.left = (panel.offsetLeft - pos1) + "px"; } function closeDragElement() { document.onmouseup = null; document.onmousemove = null; } };
        UI.setupListeners = function() { const toggleAposta = this.painel.querySelector('#toggleApostaAuto'); const inputValor = this.painel.querySelector('#inputValorAposta'); const inputMinas = this.painel.querySelector('#inputNumeroMinas'); const inputCliques = this.painel.querySelector('#inputCliquesRetirar'); toggleAposta.checked = CONFIG.apostaAutomaticaAtiva; toggleAposta.addEventListener('change', (e) => { CONFIG.apostaAutomaticaAtiva = e.target.checked; this.updateStatus(`Automação ${e.target.checked ? 'ativada' : 'desativada'}.`, 'info'); if (e.target.checked) Acao.verificarEIniciar(); }); inputValor.addEventListener('change', (e) => { CONFIG.valorBaseAposta = parseFloat(e.target.value); this.updateStatus(`Valor base alterado para R$${CONFIG.valorBaseAposta.toFixed(2)}.`, 'info'); }); inputMinas.addEventListener('change', (e) => { CONFIG.numeroDeMinas = parseInt(e.target.value, 10); this.updateStatus(`Número de minas alterado para ${CONFIG.numeroDeMinas}.`, 'info'); }); inputCliques.addEventListener('change', (e) => { CONFIG.clicksParaRetirar = parseInt(e.target.value, 10); this.updateStatus(`Cliques para retirar alterado para ${CONFIG.clicksParaRetirar}.`, 'info'); }); };
        UI.updateStats = function() { const { vitorias, derrotas } = STATE.estatisticas; this.painel.querySelector('#stats').innerHTML = `✅ ${vitorias} | ❌ ${derrotas}`; };
        UI.updateStatus = function(text, type) { const status = this.painel.querySelector('#status'); status.textContent = `Status: ${text}`; let color, bgColor; switch(type) { case 'info': color = '#3498db'; bgColor = 'rgba(52, 152, 219, 0.2)'; break; case 'win': color = '#2ecc71'; bgColor = 'rgba(46, 204, 113, 0.2)'; break; case 'error': color = '#e74c3c'; bgColor = 'rgba(231, 76, 60, 0.2)'; break; case 'warning': color = '#f39c12'; bgColor = 'rgba(243, 156, 18, 0.2)'; break; default: color = '#fff'; bgColor = 'rgba(0, 0, 0, 0.3)'; } status.style.color = color; status.style.background = bgColor; };
        
        setTimeout(() => { UI.init(); Acao.verificarEIniciar(); }, 3000);
    }

    function initDoubleBot() {
        const CONFIG = {
            velocidadeAnimacaoRoleta: 950, historicoMax: 20, delayAnalise: 3000, limiteDiff: 200, martingaleLimit: 3, valorBaseAposta: 1, apostaAutomaticaAtiva: false,
            cores: { vermelho: { bg: "#E53935", text: "#FFFFFF" }, preto: { bg: "#212121", text: "#FFFFFF" }, branco: { bg: "#FFFFFF", text: "#000000" } },
            sons: { win: 'https://www.soundjay.com/button/sounds/button-20.mp3', lose: 'https://www.soundjay.com/button/sounds/button-21.mp3', sinal: 'https://www.soundjay.com/button/sounds/button-22.mp3' },
        };
        const STATE = {
            historico: [], sinal: null, aguardandoSinal: false, martingale: 0, valorApostaAtual: CONFIG.valorBaseAposta, estatisticas: { acertos: 0, erros: 0, brancos: 0 },
            estrategiasAtivas: { "2-em-1": true, "tendencia": false, "alternancia": true, "analise-sequencia": true },
            baseMap: { "-17682.3": { numero: 1, cor: "vermelho" }, "-17890.2": { numero: 2, cor: "vermelho" }, "-18098.2": { numero: 3, cor: "vermelho" }, "-18306.1": { numero: 4, cor: "vermelho" }, "-17058.4": { numero: 5, cor: "vermelho" }, "-17266.4": { numero: 6, cor: "vermelho" }, "-17474.3": { numero: 7, cor: "vermelho" }, "-17578.3": { numero: 8, cor: "preto" }, "-17370.4": { numero: 9, cor: "preto" }, "-17162.4": { numero: 10, cor: "preto" }, "-16954.5": { numero: 11, cor: "preto" }, "-18202.2": { numero: 12, cor: "preto" }, "-17994.2": { numero: 13, cor: "preto" }, "-17786.3": { numero: 14, cor: "preto" }, "-16850.5": { numero: 0, cor: "branco" }
            },
        };
        const Util = {
            extrairTX: s => (s.match(/translateX\((-?\d+\.?\d*)px\)/) || [])[1], acharProximo: tx => { const x = parseFloat(tx); return Object.keys(STATE.baseMap).reduce((acc, k) => { const d = Math.abs(parseFloat(k) - x); return d < acc.diff ? { key: k, diff: d } : acc; }, { key: null, diff: Infinity }); },
            playSound: (url) => { const audio = new Audio(url); audio.volume = 0.5; audio.play().catch(e => console.log('Não foi possível reproduzir som:', e)); },
        };
        function monitorarRoleta() {
            const slider = document.querySelector('#roulette-slider-entries') || document.querySelector('[style*="translateX("]');
            if (!slider) { return setTimeout(monitorarRoleta, 2000); } slider.style.transition = `transform ${CONFIG.velocidadeAnimacaoRoleta}ms ease-out`; let lastTX = null;
            new MutationObserver(mutations => { mutations.forEach(mutation => { if (mutation.attributeName !== 'style') return; const tx = Util.extrairTX(mutation.target.style.transform); if (!tx || tx === lastTX) return; lastTX = tx; let resultado = STATE.baseMap[tx]; if (!resultado) { const p = Util.acharProximo(tx); if (p.diff <= CONFIG.limiteDiff) { resultado = STATE.baseMap[p.key]; STATE.baseMap[tx] = resultado; } } if (resultado) processarResultado(resultado); }); }).observe(slider, { attributes: true });
        }
        function processarResultado({ numero, cor }) {
            const lastResult = STATE.historico[STATE.historico.length - 1]; if (lastResult && lastResult.numero === numero) return;
            STATE.historico.push({ numero, cor }); if (STATE.historico.length > CONFIG.historicoMax) STATE.historico.shift();
            UI.renderHistorico(); UI.exibirResultado(numero, cor);
            if (STATE.aguardandoSinal && STATE.sinal) {
                const venceu = cor === 'branco' || cor === STATE.sinal.cor;
                if (venceu) { STATE.estatisticas.acertos++; if (cor === 'branco') STATE.estatisticas.brancos++; UI.showWinEffect(); Util.playSound(CONFIG.sons.win); UI.updateStatus(`🎉 Vitória! Apostamos em ${STATE.sinal.cor.toUpperCase()}`, 'win'); STATE.martingale = 0; STATE.valorApostaAtual = CONFIG.valorBaseAposta; } else { STATE.martingale++; if (STATE.martingale > CONFIG.martingaleLimit) { STATE.estatisticas.erros++; STATE.martingale = 0; STATE.valorApostaAtual = CONFIG.valorBaseAposta; Util.playSound(CONFIG.sons.lose); UI.updateStatus(`❌ Perdeu no Martingale. Resumo: ${cor.toUpperCase()}`, 'error'); } else { STATE.valorApostaAtual *= 2; UI.updateStatus(`⚠️ Martingale ${STATE.martingale}/${CONFIG.martingaleLimit} ativado. Próxima aposta: R$${STATE.valorApostaAtual.toFixed(2)}`, 'warning'); } }
                if (STATE.martingale === 0 || venceu) { STATE.sinal = null; STATE.aguardandoSinal = false; UI.updateStats(); setTimeout(Bot.analisar, CONFIG.delayAnalise); }
            }
        }
        const Bot = {
            analisar() {
                if (STATE.historico.length < 4) { UI.updateStatus("Aguardando mais resultados para analisar...", 'info'); return; }
                const ultimos = STATE.historico.slice(-4).map(e => e.cor);
                // Estratégias antigas
                if (STATE.estrategiasAtivas["2-em-1"] && ultimos[2] === ultimos[3] && ultimos[2] !== ultimos[1]) { const corSinal = ultimos[2] === 'vermelho' ? 'preto' : 'vermelho'; this.gerarSinal(corSinal, "Dois-em-um"); return; }
                if (STATE.estrategiasAtivas["alternancia"] && ultimos[1] !== ultimos[2] && ultimos[2] !== ultimos[3] && ultimos[1] === ultimos[3]) { const corSinal = ultimos[3] === 'vermelho' ? 'preto' : 'vermelho'; this.gerarSinal(corSinal, "Alternância"); return; }
                if (STATE.estrategiasAtivas["tendencia"]) { const ultimos10 = STATE.historico.slice(-10).map(e => e.cor); const vermelhos = ultimos10.filter(c => c === 'vermelho').length; const pretos = ultimos10.filter(c => c === 'preto').length; if (vermelhos > pretos + 3) { this.gerarSinal('vermelho', "Tendência"); return; } if (pretos > vermelhos + 3) { this.gerarSinal('preto', "Tendência"); return; } }
                
                // --- NOVA ESTRATÉGIA DE ANÁLISE DE SEQUÊNCIAS (A "IA") ---
                if (STATE.estrategiasAtivas["analise-sequencia"]) {
                    const historicoCompleto = STATE.historico.map(e => e.cor);
                    let ultimaCor = null;
                    let contador = 0;
                    for (let i = historicoCompleto.length - 1; i >= 0; i--) {
                        if (historicoCompleto[i] !== 'branco') {
                            if (ultimaCor === null) {
                                ultimaCor = historicoCompleto[i];
                                contador = 1;
                            } else if (historicoCompleto[i] === ultimaCor) {
                                contador++;
                            } else {
                                break;
                            }
                        }
                    }
                    if (contador >= 5) { // Se a sequência for de 5 ou mais repetições
                        const corSinal = ultimaCor === 'vermelho' ? 'preto' : 'vermelho';
                        this.gerarSinal(corSinal, "Análise de Sequências");
                        return;
                    }
                }
                
                UI.updateStatus("🔍 Analisando padrões...", 'info');
            },
            gerarSinal(cor, estrategia) { STATE.sinal = { cor, estrategia }; STATE.aguardandoSinal = true; Util.playSound(CONFIG.sons.sinal); UI.updateStatus(`🔎 Sinal: ${cor.toUpperCase()} (${estrategia})`, cor); if (CONFIG.apostaAutomaticaAtiva) { Aposta.fazerAposta(cor); } }
        };
        const Aposta = {
            fazerAposta(cor) { const betInput = document.querySelector('.input-wrapper input'); const buttonColorMap = { 'vermelho': 'red', 'preto': 'black', 'branco': 'white' }; const betButton = document.querySelector(`[data-testid="place-bet-${buttonColorMap[cor]}"]`); if (!betInput || !betButton) { UI.updateStatus("❌ Erro: Elementos de aposta não encontrados.", 'error'); return; } const valor = STATE.valorApostaAtual; betInput.value = valor.toFixed(2); betInput.dispatchEvent(new Event('input', { bubbles: true })); setTimeout(() => { betButton.click(); UI.updateStatus(`✅ Aposta de R$${valor.toFixed(2)} em ${cor.toUpperCase()} realizada.`, 'info'); }, 500); }
        };
        const UI = {
            painel: null, init() { this.painel = document.createElement('div'); this.painel.style.cssText = `position: fixed; top: 20px; right: 20px; background: rgba(20, 20, 20, 0.9); color: white; padding: 15px; border-radius: 12px; width: 300px; z-index: 99999; font-family: 'Segoe UI', sans-serif; backdrop-filter: blur(5px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); cursor: move; user-select: none; transition: transform 0.3s ease-out;`; this.painel.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;"><h3 style="margin: 0; font-size: 16px; color: #FFD700;">🔥 BLAZE BOT DOUBLE</h3><div id="stats" style="font-size: 12px;">✅ 0 | ❌ 0 | ⚪ 0</div></div><div id="status" style="padding: 8px; border-radius: 6px; background: rgba(0, 0, 0, 0.3); margin-bottom: 12px; font-size: 13px; min-height: 18px;">Status: Iniciando...</div><div id="ultimo-resultado" style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;"><span style="font-size: 14px;">Último Resultado:</span><div id="resultado-bola" style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px;"></div></div><div id="historico" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 12px;"></div><div id="configs"><h4 style="margin: 0 0 8px 0; font-size: 14px; color: #FFD700;">Configurações</h4><div id="aposta-container" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px;"><label style="display: flex; align-items: center; gap: 5px; font-size: 12px;">Aposta Automática: <input type="checkbox" id="toggleApostaAuto"></label><div style="display: flex; align-items: center; gap: 5px;"><label style="font-size: 12px;">Valor Base:</label><input type="number" id="inputValorAposta" value="${CONFIG.valorBaseAposta}" min="1" step="1" style="width: 50px; background: #333; border: 1px solid #555; color: white;"></div></div><div id="estrat-container" style="display: flex; flex-direction: column; gap: 5px;"></div></div>`; document.body.appendChild(this.painel); this.makeDraggable(); this.renderEstrategias(); this.setupListeners(); },
            setupListeners() { const toggleAposta = this.painel.querySelector('#toggleApostaAuto'); const inputValor = this.painel.querySelector('#inputValorAposta'); toggleAposta.checked = CONFIG.apostaAutomaticaAtiva; toggleAposta.addEventListener('change', (e) => { CONFIG.apostaAutomaticaAtiva = e.target.checked; this.updateStatus(`Aposta automática ${e.target.checked ? 'ativada' : 'desativada'}.`, 'info'); }); inputValor.addEventListener('change', (e) => { CONFIG.valorBaseAposta = parseFloat(e.target.value); STATE.valorApostaAtual = CONFIG.valorBaseAposta; this.updateStatus(`Valor base da aposta alterado para R$${CONFIG.valorBaseAposta.toFixed(2)}.`, 'info'); }); },
            exibirResultado(numero, cor) { const resultadoBola = this.painel.querySelector('#resultado-bola'); resultadoBola.textContent = numero; resultadoBola.style.background = CONFIG.cores[cor].bg; resultadoBola.style.color = CONFIG.cores[cor].text; },
            makeDraggable() { const panel = this.painel; let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0; panel.onmousedown = dragMouseDown; function dragMouseDown(e) { e = e || window.event; e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = closeDragElement; document.onmousemove = elementDrag; } function elementDrag(e) { e = e || window.event; e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY; panel.style.top = (panel.offsetTop - pos2) + "px"; panel.style.right = "unset"; panel.style.left = (panel.offsetLeft - pos1) + "px"; } function closeDragElement() { document.onmouseup = null; document.onmousemove = null; } },
            renderEstrategias() { const container = this.painel.querySelector('#estrat-container'); container.innerHTML = ''; for (const [key, value] of Object.entries(STATE.estrategiasAtivas)) { const label = document.createElement('label'); label.style.cssText = `display: flex; align-items: center; gap: 8px; font-size: 12px;`; label.innerHTML = `<input type="checkbox" data-estrat="${key}" ${value ? 'checked' : ''}> ${key.toUpperCase()}`; label.querySelector('input').addEventListener('change', (e) => { STATE.estrategiasAtivas[key] = e.target.checked; this.updateStatus(`Estratégia '${key}' ${e.target.checked ? 'ativada' : 'desativada'}.`, 'info'); }); container.appendChild(label); } },
            renderHistorico() { const container = this.painel.querySelector('#historico'); container.innerHTML = ''; STATE.historico.slice().reverse().forEach(e => { const ball = document.createElement('div'); ball.style.cssText = `width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); background: ${CONFIG.cores[e.cor].bg}; color: ${CONFIG.cores[e.cor].text};`; ball.textContent = e.numero; container.appendChild(ball); }); },
            updateStats() { const { acertos, erros, brancos } = STATE.estatisticas; this.painel.querySelector('#stats').innerHTML = `✅ ${acertos} | ❌ ${erros} | ⚪ ${brancos}`; },
            updateStatus(text, type) { const status = this.painel.querySelector('#status'); status.textContent = `Status: ${text}`; let color, bgColor; switch(type) { case 'info': color = '#3498db'; bgColor = 'rgba(52, 152, 219, 0.2)'; break; case 'win': color = '#2ecc71'; bgColor = 'rgba(46, 204, 113, 0.2)'; break; case 'error': color = '#e74c3c'; bgColor = 'rgba(231, 76, 60, 0.2)'; break; case 'warning': color = '#f39c12'; bgColor = 'rgba(243, 156, 18, 0.2)'; break; case 'vermelho': color = '#E53935'; bgColor = 'rgba(229, 57, 53, 0.2)'; break; case 'preto': color = '#212121'; bgColor = 'rgba(33, 33, 33, 0.5)'; break; default: color = '#fff'; bgColor = 'rgba(0, 0, 0, 0.3)'; } status.style.color = color; status.style.background = bgColor; };
            showWinEffect() { const effect = document.createElement('div'); effect.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99998; pointer-events: none; animation: winEffect 1s ease-out; background: linear-gradient(to top, rgba(46, 204, 113, 0.3), transparent);`; document.body.appendChild(effect); setTimeout(() => effect.remove(), 1000); };
        };
        setTimeout(() => { UI.init(); monitorarRoleta(); UI.updateStatus("Bot iniciado com sucesso", 'info'); setInterval(() => { if (!STATE.aguardandoSinal) { Bot.analisar(); } }, CONFIG.delayAnalise); }, 3000);
    }

    const url = window.location.href;
    if (url.includes('/mines')) {
        initMinesBot();
    } else if (url.includes('/double')) {
        initDoubleBot();
    }
})();
