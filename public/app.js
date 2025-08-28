// ==============================
// 🎰 SENAC Roleta - app.js REFATORADO
// ==============================

// Constantes
const STORAGE_KEY = "senac_roleta_balance";
const HISTORY_KEY = "senac_roleta_history";
const MULTIPLIER = 2;
const SLICE_COUNT = 8;
let spinning = false;

// Sistema de probabilidade dinâmica
const PROBABILITY_CONFIG = {
  initial: { win: 0.6, lose: 0.4 },
  house: { win: 0.25, lose: 0.75 },
  threshold: 4,
  resetThreshold: 15
};

// Estado do jogo
let gameState = {
  totalGames: 0,
  consecutiveLosses: 0,
  currentPhase: 'initial'
};

// Elementos DOM
const elements = {
  balance: document.getElementById("balance"),
  btnDeposit: document.getElementById("btn-deposit"),
  btnWithdraw: document.getElementById("btn-withdraw"),
  btnPlay: document.getElementById("btn-play"),
  betInput: document.getElementById("bet-amount"),
  lastResult: document.getElementById("last-result"),
  modal: document.getElementById("modal"),
  withdrawModal: document.getElementById("withdraw-modal"),
  depositValue: document.getElementById("deposit-value"),
  withdrawValue: document.getElementById("withdraw-value"),
  confirmDeposit: document.getElementById("confirm-deposit"),
  cancelDeposit: document.getElementById("cancel-deposit"),
  confirmWithdraw: document.getElementById("confirm-withdraw"),
  cancelWithdraw: document.getElementById("cancel-withdraw"),
  closeDeposit: document.getElementById("close-deposit"),
  closeWithdraw: document.getElementById("close-withdraw"),
  wheel: document.getElementById("wheel"),
  slicesGroup: document.getElementById("slices"),
  resultDisplay: document.getElementById("result-display"),
  resultIcon: document.getElementById("result-display")?.querySelector(".result-icon"),
  resultText: document.getElementById("result-display")?.querySelector(".result-text"),
  resultAmount: document.getElementById("result-display")?.querySelector(".result-amount"),
  betHistory: document.getElementById("bet-history"),
  clearHistory: document.getElementById("clear-history"),
  profileMenu: document.getElementById("profile-menu"),
  profileDropdown: document.getElementById("profile-menu")?.querySelector(".profile-dropdown"),
  availableBalance: document.getElementById("available-balance"),
  resetGameState: document.getElementById("reset-game-state"),
  houseEdge: document.getElementById("house-edge")
};

// Cores para interface
const COLORS = {
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b"
};

// Elementos de áudio
const audioElements = {
  spin: document.getElementById("spin-sound"),
  win: document.getElementById("win-sound"),
  lose: document.getElementById("lose-sound")
};

// ==============================
// 🎯 FUNÇÕES UTILITÁRIAS
// ==============================

// Formatação de números
const fmt = (n) => (n || 0).toLocaleString("pt-BR", { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
});

// Formatação de data/hora
const formatDateTime = (date) => {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// Função para tocar som
function playSound(type) {
  try {
    if (audioElements[type]) {
      audioElements[type].currentTime = 0;
      audioElements[type].play().catch(() => {});
    }
  } catch (error) {
    console.log("Áudio não disponível");
  }
}

// ==============================
// 💾 GERENCIAMENTO DE DADOS
// ==============================

// Funções de localStorage
const readBalance = () => { 
  const balance = Number(localStorage.getItem(STORAGE_KEY)); 
  return isNaN(balance) ? 0 : balance; 
};

const writeBalance = (value) => localStorage.setItem(STORAGE_KEY, String(value));

const readHistory = () => {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

const writeHistory = (history) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Erro ao salvar histórico:", error);
  }
};

// Funções para persistir o estado do jogo
function saveGameState() {
  localStorage.setItem('roulette_game_state', JSON.stringify(gameState));
}

function loadGameState() {
  const savedState = localStorage.getItem('roulette_game_state');
  if (savedState) {
    try {
      gameState = JSON.parse(savedState);
    } catch (error) {
      console.error('Erro ao carregar estado do jogo:', error);
      resetGameState();
    }
  }
}

function resetGameState() {
  gameState = {
    totalGames: 0,
    consecutiveLosses: 0,
    currentPhase: 'initial'
  };
  saveGameState();
  updateProbabilityUI();
  showNotification('Estado do jogo resetado!', 'info');
}

// ==============================
// 🎲 SISTEMA DE PROBABILIDADE
// ==============================

function getCurrentProbability() {
  if (gameState.consecutiveLosses >= PROBABILITY_CONFIG.resetThreshold) {
    gameState.currentPhase = 'initial';
    gameState.consecutiveLosses = 0;
  }
  
  return gameState.totalGames < PROBABILITY_CONFIG.threshold 
    ? PROBABILITY_CONFIG.initial 
    : PROBABILITY_CONFIG.house;
}

function generateResult() {
  const probability = getCurrentProbability();
  return Math.random() < probability.win ? 'WIN' : 'LOSE';
}

function updateGameState(result) {
  gameState.totalGames++;
  gameState.consecutiveLosses = result === 'LOSE' ? gameState.consecutiveLosses + 1 : 0;
  
  if (gameState.totalGames >= PROBABILITY_CONFIG.threshold) {
    gameState.currentPhase = 'house';
  }
  
  saveGameState();
  updateProbabilityUI();
}

function updateProbabilityUI() {
  const probability = getCurrentProbability();
  const phaseText = gameState.currentPhase === 'initial' ? 'Favorável ao Jogador' : 'Favorável à Casa';
  const phaseColor = gameState.currentPhase === 'initial' ? '#4CAF50' : '#F44336';
  
  if (elements.houseEdge) {
    elements.houseEdge.innerHTML = `
      <span style="color: ${phaseColor}">${phaseText}</span><br>
      <small>Probabilidade: WIN ${(probability.win * 100).toFixed(1)}% / LOSE ${(probability.lose * 100).toFixed(1)}%</small><br>
      <small>Rodadas: ${gameState.totalGames}/${PROBABILITY_CONFIG.threshold} | Perdas seguidas: ${gameState.consecutiveLosses}/${PROBABILITY_CONFIG.resetThreshold}</small>
    `;
  }
}

// ==============================
// 💰 GERENCIAMENTO FINANCEIRO
// ==============================

function updateBalance(amount, operation = 'add') {
  if (amount <= 0) return false;
  
  const currentBalance = readBalance();
  let newBalance;
  
  if (operation === 'add') {
    newBalance = currentBalance + amount;
  } else {
    newBalance = currentBalance - amount;
    if (newBalance < 0) return false;
  }
  
  writeBalance(newBalance);
  setBalanceUI();
  return true;
}

function deposit(amount) {
  if (updateBalance(amount, 'add')) {
    showNotification(`Depósito de R$ ${fmt(amount)} realizado com sucesso!`, 'success');
    return true;
  }
  return false;
}

function withdraw(amount) {
  if (updateBalance(amount, 'subtract')) {
    showNotification(`Saque de R$ ${fmt(amount)} realizado com sucesso!`, 'success');
    return true;
  } else {
    showNotification("Saldo insuficiente para saque!", 'error');
    return false;
  }
}

// Atualiza UI do saldo
function setBalanceUI() {
  if (elements.balance) {
    elements.balance.textContent = fmt(readBalance());
    
    // Animação de atualização
    elements.balance.style.transform = "scale(1.1)";
    elements.balance.style.color = COLORS.success;
    setTimeout(() => {
      elements.balance.style.transform = "scale(1)";
    }, 200);
  }
}

// Atualiza saldo disponível no modal de saque
function updateAvailableBalance() {
  if (elements.availableBalance) {
    elements.availableBalance.textContent = `R$ ${fmt(readBalance())}`;
  }
}

// ==============================
// 📜 HISTÓRICO DE APOSTAS
// ==============================

function addToHistory(bet, outcome, prize, balanceAfter) {
  const history = readHistory();
  const newEntry = {
    id: Date.now(),
    timestamp: new Date(),
    bet,
    outcome,
    prize,
    balanceAfter,
    profit: outcome === 'WIN' ? prize - bet : -bet
  };
  
  history.unshift(newEntry);
  
  // Mantém apenas os últimos 50 registros
  if (history.length > 50) {
    history.splice(50);
  }
  
  writeHistory(history);
  updateHistoryUI();
}

function updateHistoryUI() {
  if (!elements.betHistory) return;
  
  const history = readHistory();
  
  if (history.length === 0) {
    elements.betHistory.innerHTML = `
      <div class="history-placeholder">
        <i class="fas fa-info-circle"></i>
        <p>Nenhuma aposta realizada ainda</p>
      </div>
    `;
    return;
  }
  
  elements.betHistory.innerHTML = history.map(record => `
    <div class="bet-item">
      <div class="bet-info">
        <div class="bet-amount">R$ ${fmt(record.bet)}</div>
        <div class="bet-time">${formatDateTime(new Date(record.timestamp))}</div>
      </div>
      <div class="bet-result ${record.outcome.toLowerCase()}">
        <i class="fas fa-${record.outcome === 'WIN' ? 'trophy' : 'times-circle'}"></i>
        ${record.outcome}
      </div>
      <div class="bet-balance">
        R$ ${fmt(record.balanceAfter)}
      </div>
    </div>
  `).join('');
}

function clearHistory() {
  if (confirm("Tem certeza que deseja limpar todo o histórico?")) {
    writeHistory([]);
    updateHistoryUI();
    showNotification("Histórico limpo com sucesso!", 'info');
  }
}

// ==============================
// 🎡 ROLETA - VISUAL
// ==============================

// Função utilitária para criar elementos SVG
function createSVGElement(type, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", type);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

// Cria gradientes SVG
function createSVGGradients() {
  const defs = createSVGElement("defs");
  
  // Gradiente para WIN
  const winGradient = createSVGElement("linearGradient", {
    id: "winGradient",
    x1: "0%", y1: "0%",
    x2: "100%", y2: "100%"
  });
  
  [
    { offset: "0%", color: "#4CAF50" },
    { offset: "30%", color: "#66BB6A" },
    { offset: "70%", color: "#388E3C" },
    { offset: "100%", color: "#2E7D32" }
  ].forEach(stop => {
    winGradient.appendChild(createSVGElement("stop", {
      offset: stop.offset,
      "stop-color": stop.color
    }));
  });
  
  // Gradiente para LOSE
  const loseGradient = createSVGElement("linearGradient", {
    id: "loseGradient",
    x1: "0%", y1: "0%",
    x2: "100%", y2: "100%"
  });
  
  [
    { offset: "0%", color: "#F44336" },
    { offset: "30%", color: "#EF5350" },
    { offset: "70%", color: "#D32F2F" },
    { offset: "100%", color: "#C62828" }
  ].forEach(stop => {
    loseGradient.appendChild(createSVGElement("stop", {
      offset: stop.offset,
      "stop-color": stop.color
    }));
  });
  
  // Gradiente para bordas
  const borderGradient = createSVGElement("linearGradient", {
    id: "borderGradient",
    x1: "0%", y1: "0%",
    x2: "100%", y2: "100%"
  });
  
  [
    { offset: "0%", color: "#FFD700" },
    { offset: "50%", color: "#FFA000" },
    { offset: "100%", color: "#FFD700" }
  ].forEach(stop => {
    borderGradient.appendChild(createSVGElement("stop", {
      offset: stop.offset,
      "stop-color": stop.color
    }));
  });
  
  defs.appendChild(winGradient);
  defs.appendChild(loseGradient);
  defs.appendChild(borderGradient);
  
  return defs;
}

// Desenha a roleta
function drawWheel() {
  if (!elements.slicesGroup) return;
  
  elements.slicesGroup.innerHTML = "";
  const angle = 360 / SLICE_COUNT;
  
  // Adiciona gradientes
  const defs = createSVGGradients();
  elements.wheel.insertBefore(defs, elements.wheel.firstChild);
  
  // Cria slices
  for (let i = 0; i < SLICE_COUNT; i++) {
    const start = (i * angle - 90) * (Math.PI / 180);
    const end = ((i + 1) * angle - 90) * (Math.PI / 180);
    const radius = 100;
    
    const x1 = 100 + radius * Math.cos(start);
    const y1 = 100 + radius * Math.sin(start);
    const x2 = 100 + radius * Math.cos(end);
    const y2 = 100 + radius * Math.sin(end);
    
    // Cria slice
    const path = createSVGElement("path", {
      d: `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`,
      class: i % 2 === 0 ? "win-slice" : "lose-slice",
      style: `fill: url(#${i % 2 === 0 ? 'win' : 'lose'}Gradient); stroke: url(#borderGradient); stroke-width: 2;`
    });
    
    elements.slicesGroup.appendChild(path);
    
    // Cria label
    const labelAngle = (i + 0.5) * angle - 90;
    const labelX = 100 + 65 * Math.cos((labelAngle * Math.PI) / 180);
    const labelY = 100 + 65 * Math.sin((labelAngle * Math.PI) / 180);
    
    const text = createSVGElement("text", {
      x: labelX,
      y: labelY,
      class: "slice-label",
      "text-anchor": "middle",
      "dominant-baseline": "middle"
    });
    
    text.textContent = i % 2 === 0 ? "WIN" : "LOSE";
    elements.slicesGroup.appendChild(text);
  }
  
  // Cria círculo central
  const centerCircle = createSVGElement("circle", {
    cx: "100",
    cy: "100",
    r: "15",
    fill: "url(#borderGradient)",
    stroke: "#B8860B",
    "stroke-width": "3",
    filter: "drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))"
  });
  
  elements.slicesGroup.appendChild(centerCircle);
  
  // Cria linhas divisórias
  for (let i = 0; i < SLICE_COUNT; i++) {
    const lineAngle = i * angle - 90;
    const x = 100 + 100 * Math.cos((lineAngle * Math.PI) / 180);
    const y = 100 + 100 * Math.sin((lineAngle * Math.PI) / 180);
    
    const line = createSVGElement("line", {
      x1: "100",
      y1: "100",
      x2: x,
      y2: y,
      stroke: "url(#borderGradient)",
      "stroke-width": "2",
      opacity: "0.6"
    });
    
    elements.slicesGroup.appendChild(line);
  }
}

// Animação da roleta
async function spinVisualTo(outcome) {
  const anglePerSlice = 360 / SLICE_COUNT;
  const candidateIndexes = [];
  
  // Encontra índices válidos para o resultado
  for (let i = 0; i < SLICE_COUNT; i++) {
    const isWin = i % 2 === 0;
    if ((outcome === "WIN" && isWin) || (outcome === "LOSE" && !isWin)) {
      candidateIndexes.push(i);
    }
  }
  
  // Seleciona um índice aleatório
  const idx = candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)];
  const fullSpins = 4;
  const targetAngle = fullSpins * 360 + idx * anglePerSlice + anglePerSlice / 2;
  
  // Aplica a animação
  elements.wheel.style.transform = `rotate(-22.5deg) rotate(${targetAngle}deg)`;
  elements.wheel.classList.add("spin");
  
  // Aguarda a animação terminar
  return new Promise(resolve => setTimeout(resolve, 2500));
}

// Mostra resultado em destaque
function showResultDisplay(outcome, amount) {
  if (!elements.resultDisplay || !elements.resultIcon || !elements.resultText || !elements.resultAmount) return;
  
  const isWin = outcome === 'WIN';
  const icon = isWin ? '🎉' : '💔';
  const text = isWin ? 'VITÓRIA!' : 'DERROTA';
  const color = isWin ? COLORS.success : COLORS.error;
  
  elements.resultIcon.textContent = icon;
  elements.resultText.textContent = text;
  elements.resultAmount.textContent = isWin ? `+R$ ${fmt(amount)}` : `-R$ ${fmt(amount)}`;
  
  elements.resultDisplay.style.borderColor = color;
  elements.resultDisplay.classList.remove('hidden');
  elements.resultDisplay.classList.add('show');
  
  // Esconde após 3 segundos
  setTimeout(() => {
    elements.resultDisplay.classList.remove('show');
    setTimeout(() => {
      elements.resultDisplay.classList.add('hidden');
    }, 500);
  }, 3000);
}

// ==============================
// 🎮 FUNÇÃO PRINCIPAL DO JOGO
// ==============================

async function play() {
  if (spinning) return;
  
  const bet = Math.max(1, Number(elements.betInput.value || 0));
  const currentBalance = readBalance();
  
  if (bet > currentBalance) {
    showNotification("Saldo insuficiente para esta aposta!", 'error');
    return;
  }
  
  if (bet <= 0) {
    showNotification("Valor da aposta deve ser maior que zero!", 'error');
    return;
  }
  
  // Estado de loading
  spinning = true;
  elements.btnPlay.disabled = true;
  elements.lastResult.textContent = "Girando...";
  elements.lastResult.style.color = COLORS.warning;
  
  // Toca som de giro
  playSound('spin');
  
  // Gera resultado
  const outcome = generateResult();
  
  // Animação da roleta
  await spinVisualTo(outcome);
  
  // Atualiza o estado do jogo
  updateGameState(outcome);
  
  // Processa resultado
  let prize = 0;
  let balanceAfter = 0;
  
  if (outcome === "WIN") {
    prize = bet * MULTIPLIER;
    balanceAfter = currentBalance - bet + prize;
    writeBalance(balanceAfter);
    
    elements.lastResult.textContent = `🎉 WIN! +R$ ${fmt(prize - bet)}`;
    elements.lastResult.style.color = COLORS.success;
    showNotification(`Parabéns! Você ganhou R$ ${fmt(prize - bet)}!`, 'success');
    playSound('win');
  } else {
    balanceAfter = currentBalance - bet;
    writeBalance(balanceAfter);
    
    elements.lastResult.textContent = `💔 LOSE! -R$ ${fmt(bet)}`;
    elements.lastResult.style.color = COLORS.error;
    showNotification(`Que pena! Você perdeu R$ ${fmt(bet)}.`, 'error');
    playSound('lose');
  }
  
  // Adiciona ao histórico
  addToHistory(bet, outcome, prize, balanceAfter);
  
  // Mostra resultado em destaque
  showResultDisplay(outcome, outcome === 'WIN' ? prize - bet : bet);
  
  // Atualiza UI
  setBalanceUI();
  
  // Reset do estado
  elements.wheel.classList.remove("spin");
  elements.wheel.style.transform = "rotate(-22.5deg)";
  spinning = false;
  elements.btnPlay.disabled = false;
}

// ==============================
// 📱 INTERFACE E MODAIS
// ==============================

// Funções do modal
function openModal(modalType = 'deposit') {
  const modal = modalType === 'deposit' ? elements.modal : elements.withdrawModal;
  modal.classList.remove("hidden");
  modal.classList.add("show");
  
  if (modalType === 'deposit') {
    elements.depositValue.focus();
  } else {
    updateAvailableBalance();
    elements.withdrawValue.focus();
  }
}

function closeModal(modalType = 'deposit') {
  const modal = modalType === 'deposit' ? elements.modal : elements.withdrawModal;
  modal.classList.remove("show");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// Sistema de notificações
function showNotification(message, type = 'info') {
  // Remove notificação anterior
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="notification-message">${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Anima entrada
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Remove após 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Funções para botões rápidos
function setQuickBet(value) {
  elements.betInput.value = value;
  elements.betInput.focus();
  
  // Remove classe ativa de todos os botões
  document.querySelectorAll('.quick-bet-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Adiciona classe ativa ao botão clicado
  event.target.classList.add('active');
}

function setQuickDeposit(value) {
  elements.depositValue.value = value;
  elements.depositValue.focus();
  
  // Remove classe ativa de todos os botões
  document.querySelectorAll('.quick-deposit-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Adiciona classe ativa ao botão clicado
  event.target.classList.add('active');
}

// Toggle do menu dropdown
function toggleProfileDropdown() {
  if (elements.profileDropdown) {
    elements.profileDropdown.classList.toggle('show');
  }
}

// ==============================
// 🎯 CONFIGURAÇÃO DE EVENTOS
// ==============================

// Configura todos os event listeners
function setupEventListeners() {
  // Botões de depósito e saque
  elements.btnDeposit.addEventListener("click", () => openModal('deposit'));
  elements.btnWithdraw.addEventListener("click", () => openModal('withdraw'));
  
  // Botões de fechar modal
  elements.closeDeposit.addEventListener("click", () => closeModal('deposit'));
  elements.closeWithdraw.addEventListener("click", () => closeModal('withdraw'));
  
  // Botões de cancelar
  elements.cancelDeposit.addEventListener("click", () => closeModal('deposit'));
  elements.cancelWithdraw.addEventListener("click", () => closeModal('withdraw'));
  
  // Confirmações
  elements.confirmDeposit.addEventListener("click", () => {
    const amount = Number(elements.depositValue.value || 0);
    if (amount > 0) {
      deposit(amount);
      closeModal('deposit');
      elements.depositValue.value = "100";
    } else {
      showNotification("Por favor, insira um valor válido!", 'error');
    }
  });
  
  elements.confirmWithdraw.addEventListener("click", () => {
    const amount = Number(elements.withdrawValue.value || 0);
    if (amount > 0) {
      if (withdraw(amount)) {
        closeModal('withdraw');
        elements.withdrawValue.value = "50";
      }
    } else {
      showNotification("Por favor, insira um valor válido!", 'error');
    }
  });
  
  // Botões rápidos de aposta
  document.querySelectorAll('.quick-bet-btn').forEach(btn => {
    btn.addEventListener('click', (e) => setQuickBet(Number(e.target.dataset.value)));
  });
  
  // Botões rápidos de depósito
  document.querySelectorAll('.quick-deposit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => setQuickDeposit(Number(e.target.dataset.value)));
  });
  
  // Jogo
  elements.btnPlay.addEventListener("click", play);
  
  // Histórico
  if (elements.clearHistory) {
    elements.clearHistory.addEventListener("click", clearHistory);
  }
  
  // Reset do estado do jogo
  if (elements.resetGameState) {
    elements.resetGameState.addEventListener("click", resetGameState);
  }
  
  // Profile menu
  if (elements.profileMenu) {
    elements.profileMenu.addEventListener("click", toggleProfileDropdown);
  }
  
  // Fecha modais ao clicar fora
  elements.modal.addEventListener("click", (e) => {
    if (e.target === elements.modal) {
      closeModal('deposit');
    }
  });
  
  elements.withdrawModal.addEventListener("click", (e) => {
    if (e.target === elements.withdrawModal) {
      closeModal('withdraw');
    }
  });
  
  // Fecha modais com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!elements.modal.classList.contains("hidden")) {
        closeModal('deposit');
      }
      if (!elements.withdrawModal.classList.contains("hidden")) {
        closeModal('withdraw');
      }
    }
  });
  
  // Fecha dropdown ao clicar fora
  document.addEventListener("click", (e) => {
    if (elements.profileDropdown && !elements.profileMenu.contains(e.target)) {
      elements.profileDropdown.classList.remove('show');
    }
  });
}

// ==============================
// 🚀 INICIALIZAÇÃO
// ==============================

function init() {
  // Inicializa o saldo se não existir
  if (localStorage.getItem(STORAGE_KEY) === null) {
    writeBalance(0);
  }
  
  // Carrega estado salvo
  loadGameState();
  
  // Configura a interface
  setBalanceUI();
  drawWheel();
  updateHistoryUI();
  updateProbabilityUI();
  
  // Configura event listeners
  setupEventListeners();
  
  console.log("🎰 SENAC Roleta inicializada com sucesso!");
}

// Inicia a aplicação
init();