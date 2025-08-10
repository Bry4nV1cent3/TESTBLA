// ==UserScript==
// @name         Blaze Bot Premium - Auto Análise + Efeitos
// @namespace    https://github.com/seu-usuario
// @version      4.4
// @description  Bot automático para Blaze com análise de padrões, efeitos visuais e sonoros
// @author       Você
// @match        *://blaze.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // Configurações principais
  const CONFIG = {
    velocidade: 950,
    historicoMax: 15,
    delayAnalise: 2000,
    limiteDiff: 200,
    cores: {
      branco: { bg: "#FFFFFF", text: "#000000" },
      vermelho: { bg: "#E53935", text: "#FFFFFF" },
      preto: { bg: "#212121", text: "#FFFFFF" }
    },
    sons: {
      win: 'https://www.soundjay.com/buttons/sounds/button-09.mp3',
      lose: 'https://www.soundjay.com/buttons/sounds/button-10.mp3'
    }
  };

  // Estado do bot
  const STATE = {
    historico: [],
    sinal: null,
    aguardando: false,
    martingale: false,
    estatisticas: { acertos: 0, erros: 0, branco: 0 },
    baseMap: {
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

  // Utilitários
  const Util = {
    log: (...msg) => console.log('[🔥 BlazeBot]', ...msg),
    extrairTX: s => (s.match(/translateX\((-?\d+\.?\d*)px\)/) || [])[1],
    acharProximo: tx => {
      const x = parseFloat(tx);
      return Object.keys(STATE.baseMap).reduce((acc, k) => {
        const d = Math.abs(parseFloat(k) - x);
        return d < acc.diff ? { key: k, diff: d } : acc;
      }, { key: null, diff: Infinity });
    },
    playSound: (url) => {
      const audio = new Audio(url);
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Não foi possível reproduzir som:', e));
    }
  };

  // Monitoramento da roleta
  function monitorarRoleta() {
    const slider = document.querySelector('#roulette-slider-entries') || document.querySelector('[style*="translateX("]');
    if (!slider) return setTimeout(monitorarRoleta, 2000);
    
    slider.style.transition = `transform ${CONFIG.velocidade}ms ease-out`;
    let last = null;
    
    new MutationObserver(ms => {
      ms.forEach(m => {
        if (m.attributeName !== 'style') return;
        const tx = Util.extrairTX(m.target.style.transform);
        if (!tx || tx === last) return;
        last = tx;
        
        if (STATE.baseMap[tx]) return processarResultado(STATE.baseMap[tx]);
        
        const p = Util.acharProximo(tx);
        if (p.diff <= CONFIG.limiteDiff) {
          const info = STATE.baseMap[p.key];
          STATE.baseMap[tx] = info;
          return processarResultado(info);
        }
      });
    }).observe(slider, { attributes: true });
  }

  // Processamento dos resultados
  function processarResultado({ numero, cor }) {
    const last = STATE.historico[STATE.historico.length - 1];
    if (last && last.numero === numero) return;
    
    STATE.historico.push({ numero, cor });
    if (STATE.historico.length > CONFIG.historicoMax) STATE.historico.shift();
    UI.renderHistorico();
    
    if (!STATE.aguardando || !STATE.sinal) return;

    const ganhou = cor === 'branco' || cor === STATE.sinal;
    
    if (ganhou) {
      STATE.estatisticas.acertos++;
      if (cor === 'branco') STATE.estatisticas.branco++;
      STATE.martingale = false;
      UI.showWinEffect();
      Util.playSound(CONFIG.sons.win);
      UI.updateStatus(`🎉 Vitória! ${cor.toUpperCase()}`, 'win');
    } else {
      if (!STATE.martingale) {
        STATE.martingale = true;
        UI.updateStatus(`⚠️ Martingale ativado`, 'warning');
      } else {
        STATE.estatisticas.erros++;
        STATE.martingale = false;
        Util.playSound(CONFIG.sons.lose);
        UI.updateStatus(`❌ Perdeu ${cor.toUpperCase()}`, 'error');
      }
    }

    if (!STATE.martingale) {
      STATE.sinal = null;
      STATE.aguardando = false;
      UI.updateStats();
      setTimeout(Bot.analisar, CONFIG.delayAnalise);
    }
  }

  // Lógica do bot
  const Bot = {
    analisar() {
      if (STATE.historico.length < 3) return;
      
      const estrategias = {
        martingale: () => {
          const c = STATE.historico.slice(-3).map(e => e.cor);
          return c.every(x => x === c[0]) ? (c[0] === 'vermelho' ? 'preto' : 'vermelho') : null;
        },
        alternada: () => {
          const c = STATE.historico.slice(-3).map(e => e.cor);
          return c[0] !== c[1] && c[1] === c[2] ? c[0] : null;
        },
        reversao: () => {
          const c = STATE.historico.slice(-4).map(e => e.cor);
          return c.every(x => x === c[0]) ? (c[0] === 'vermelho' ? 'preto' : 'vermelho') : null;
        }
      };
      
      for (const [nome, estrategia] of Object.entries(estrategias)) {
        const cor = estrategia();
        if (cor) {
          STATE.sinal = cor;
          STATE.aguardando = true;
          UI.updateStatus(`🔎 Sinal: ${cor.toUpperCase()} (${nome})`, 'info');
          return;
        }
      }
      
      UI.updateStatus("🔍 Analisando padrões...", 'info');
    }
  };

  // Interface do usuário
  const UI = {
    painel: null,
    init() {
      this.painel = document.createElement('div');
      this.painel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(20, 20, 20, 0.9);
        color: white;
        padding: 15px;
        border-radius: 12px;
        width: 280px;
        z-index: 99999;
        font-family: 'Segoe UI', sans-serif;
        backdrop-filter: blur(5px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        cursor: move;
        user-select: none;
      `;
      
      this.painel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; color: #FFD700;">🔥 BLAZE BOT PREMIUM</h3>
          <div id="stats" style="font-size: 12px;">
            ✅ 0 | ❌ 0 | ⚪ 0
          </div>
        </div>
        <div id="status" style="
          padding: 8px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.3);
          margin-bottom: 12px;
          font-size: 13px;
          min-height: 18px;
        ">Status: Iniciando...</div>
        <div id="historico" style="
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-bottom: 12px;
        "></div>
      `;
      
      document.body.appendChild(this.painel);
      this.makeDraggable();
      this.renderHistorico();
    },
    
    makeDraggable() {
      const panel = this.painel;
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      
      panel.onmousedown = dragMouseDown;
      
      function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }
      
      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        panel.style.top = (panel.offsetTop - pos2) + "px";
        panel.style.right = "unset";
        panel.style.left = (panel.offsetLeft - pos1) + "px";
      }
      
      function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
      }
    },
    
    renderHistorico() {
      const container = this.painel.querySelector('#historico');
      container.innerHTML = '';
      
      STATE.historico.slice().reverse().forEach(e => {
        const ball = document.createElement('div');
        ball.style.cssText = `
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          background: ${CONFIG.cores[e.cor].bg};
          color: ${CONFIG.cores[e.cor].text};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        `;
        ball.textContent = e.numero;
        container.appendChild(ball);
      });
    },
    
    updateStats() {
      const { acertos, erros, branco } = STATE.estatisticas;
      this.painel.querySelector('#stats').innerHTML = `✅ ${acertos} | ❌ ${erros} | ⚪ ${branco}`;
    },
    
    updateStatus(text, type) {
      const status = this.painel.querySelector('#status');
      status.textContent = `Status: ${text}`;
      
      const colors = {
        info: '#3498db',
        win: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12'
      };
      
      status.style.background = `rgba(${
        type === 'win' ? '46, 204, 113' : 
        type === 'error' ? '231, 76, 60' : 
        type === 'warning' ? '243, 156, 18' : '52, 152, 219'
      }, 0.2)`;
      
      status.style.color = colors[type] || '#fff';
    },
    
    showWinEffect() {
      const effect = document.createElement('div');
      effect.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(46, 204, 113, 0.3);
        z-index: 99998;
        pointer-events: none;
        animation: fadeInOut 1s ease-out;
      `;
      
      document.body.appendChild(effect);
      setTimeout(() => effect.remove(), 1000);
      
      // Efeito de confetes
      setTimeout(() => {
        for (let i = 0; i < 50; i++) {
          const confetti = document.createElement('div');
          confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${['#f00', '#0f0', '#00f', '#ff0', '#f0f'][i % 5]};
            top: -10px;
            left: ${Math.random() * 100}%;
            z-index: 99999;
            pointer-events: none;
            animation: confettiFall ${Math.random() * 2 + 1}s linear forwards;
          `;
          document.body.appendChild(confetti);
          setTimeout(() => confetti.remove(), 2000);
        }
      }, 100);
    }
  };

  // Adicionar animações CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; }
      50% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes confettiFall {
      to { transform: translateY(100vh) rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Inicialização
  setTimeout(() => {
    UI.init();
    monitorarRoleta();
    UI.updateStatus("Bot iniciado com sucesso", 'info');
    
    // Loop de análise automática
    setInterval(() => {
      if (!STATE.aguardando) Bot.analisar();
    }, CONFIG.delayAnalise);
  }, 3000);
})();
