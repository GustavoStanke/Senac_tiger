const STORAGE_KEY = "senac_roleta_balance";
const HISTORY_KEY = "senac_roleta_history";
const MULTIPLIER = 2;
const SLICE_COUNT = 8;
let spinning = false;

// Sistema de probabilidade dinâmica
const PROBABILITY_CONFIG = {
  initial: {
    win: 0.60,    // 60% Win / 40% Lose nas primeiras rodadas
    lose: 0.40
  },
  house: {
    win: 0.25,    // 25% Win / 75% Lose após as primeiras rodadas
    lose: 0.75
  },
  threshold: 4,   // Número de rodadas antes de mudar para probabilidade da casa
  resetThreshold: 15  // Número de perdas seguidas para resetar
};

// Estado do jogo para probabilidade dinâmica
let gameState = {
  totalGames: 0,
  consecutiveLosses: 0,
  currentPhase: 'initial' // 'initial' ou 'house'
};

// Função para determinar a probabilidade atual
function getCurrentProbability() {
  if (gameState.consecutiveLosses >= PROBABILITY_CONFIG.resetThreshold) {
    // Reset após muitas perdas seguidas
    gameState.currentPhase = 'initial';
    gameState.consecutiveLosses = 0;
    console.log('🔄 Probabilidade resetada para fase inicial após muitas perdas!');
  }
  
  if (gameState.totalGames < PROBABILITY_CONFIG.threshold) {
    return PROBABILITY_CONFIG.initial;
  } else {
    return PROBABILITY_CONFIG.house;
  }
}

// Função para gerar resultado baseado na probabilidade atual
function generateResult() {
  const probability = getCurrentProbability();
  const random = Math.random();
  
  if (random < probability.win) {
    return 'WIN';
  } else {
    return 'LOSE';
  }
}

// Função para atualizar o estado do jogo
function updateGameState(result) {
  gameState.totalGames++;
  
  if (result === 'LOSE') {
    gameState.consecutiveLosses++;
  } else {
    gameState.consecutiveLosses = 0;
  }
  
  // Atualiza a fase baseada no número de jogadas
  if (gameState.totalGames >= PROBABILITY_CONFIG.threshold) {
    gameState.currentPhase = 'house';
  }
  
  // Salva o estado automaticamente
  saveGameState();
  
  console.log(`🎯 Jogo #${gameState.totalGames} - Fase: ${gameState.currentPhase} - Perdas seguidas: ${gameState.consecutiveLosses}`);
  console.log(`📊 Probabilidade atual: WIN ${(getCurrentProbability().win * 100).toFixed(1)}% / LOSE ${(getCurrentProbability().lose * 100).toFixed(1)}%`);
}

// Função para atualizar a interface com informações de probabilidade
function updateProbabilityUI() {
  const probability = getCurrentProbability();
  const phaseText = gameState.currentPhase === 'initial' ? 'Favorável ao Jogador' : 'Favorável à Casa';
  const phaseColor = gameState.currentPhase === 'initial' ? '#4CAF50' : '#F44336';
  
  // Atualiza o elemento principal de probabilidade
  const houseEdgeElement = document.getElementById('house-edge');
  if (houseEdgeElement) {
    houseEdgeElement.innerHTML = `
      <span style="color: ${phaseColor}">${phaseText}</span><br>
      <small>Probabilidade: WIN ${(probability.win * 100).toFixed(1)}% / LOSE ${(probability.lose * 100).toFixed(1)}%</small><br>
      <small>Rodadas: ${gameState.totalGames}/${PROBABILITY_CONFIG.threshold} | Perdas seguidas: ${gameState.consecutiveLosses}/${PROBABILITY_CONFIG.resetThreshold}</small>
    `;
  }
}

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

// Funções de localStorage
const readBalance = () => { 
  const b = Number(localStorage.getItem(STORAGE_KEY)); 
  return isNaN(b) ? 0 : b; 
};

const writeBalance = (v) => localStorage.setItem(STORAGE_KEY, String(v));

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
      console.log('🔄 Estado do jogo carregado:', gameState);
    } catch (error) {
      console.error('❌ Erro ao carregar estado do jogo:', error);
      gameState = {
        totalGames: 0,
        consecutiveLosses: 0,
        currentPhase: 'initial'
      };
    }
  }
}

// Função para resetar o estado do jogo (para testes)
function resetGameState() {
  gameState = {
    totalGames: 0,
    consecutiveLosses: 0,
    currentPhase: 'initial'
  };
  saveGameState();
  updateProbabilityUI();
  showNotification('🔄 Estado do jogo resetado!', 'info');
}

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
  resetGameState: document.getElementById("reset-game-state")
};

// Constantes para cores
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

// Função utilitária para criar elementos SVG
function createSVGElement(type, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", type);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

// Atualiza UI do saldo com animação
function setBalanceUI() { 
  const balanceEl = elements.balance;
  balanceEl.textContent = fmt(readBalance()); 
  
  // Animação de atualização
  balanceEl.style.transform = "scale(1.1)";
  balanceEl.style.color = COLORS.success;
  setTimeout(() => {
    balanceEl.style.transform = "scale(1)";
    balanceEl.style.color = COLORS.success;
  }, 200);
}

// Cria gradientes SVG mais atrativos
function createSVGGradients() {
  const defs = createSVGElement("defs");
  
  // Gradiente para WIN - Verde com brilho
  const winGradient = createSVGElement("linearGradient", {
    id: "winGradient",
    x1: "0%", y1: "0%",
    x2: "100%", y2: "100%"
  });
  
  const winStops = [
    { offset: "0%", color: "#4CAF50" },
    { offset: "30%", color: "#66BB6A" },
    { offset: "70%", color: "#388E3C" },
    { offset: "100%", color: "#2E7D32" }
  ];
  
  winStops.forEach(stop => {
    const stopElement = createSVGElement("stop", {
      offset: stop.offset,
      "stop-color": stop.color
    });
    winGradient.appendChild(stopElement);
  });
  
  // Gradiente para LOSE - Vermelho com brilho
  const loseGradient = createSVGElement("linearGradient", {
    id: "loseGradient",
    x1: "0%", y1: "0%",
    x2: "100%", y2: "100%"
  });
  
  const loseStops = [
    { offset: "0%", color: "#F44336" },
    { offset: "30%", color: "#EF5350" },
    { offset: "70%", color: "#D32F2F" },
    { offset: "100%", color: "#C62828" }
  ];
  
  loseStops.forEach(stop => {
    const stopElement = createSVGElement("stop", {
      offset: stop.offset,
      "stop-color": stop.color
    });
    loseGradient.appendChild(stopElement);
  });
  
  // Gradiente para bordas das slices
  const borderGradient = createSVGElement("linearGradient", {
    id: "borderGradient",
    x1: "0%", y1: "0%",
    x2: "100%", y2: "100%"
  });
  
  const borderStops = [
    { offset: "0%", color: "#FFD700" },
    { offset: "50%", color: "#FFA000" },
    { offset: "100%", color: "#FFD700" }
  ];
  
  borderStops.forEach(stop => {
    const stopElement = createSVGElement("stop", {
      offset: stop.offset,
      "stop-color": stop.color
    });
    borderGradient.appendChild(stopElement);
  });
  
  defs.appendChild(winGradient);
  defs.appendChild(loseGradient);
  defs.appendChild(borderGradient);
  
  return defs;
}

// Desenha a roleta com melhorias visuais
function drawWheel() {
  elements.slicesGroup.innerHTML = "";
  const angle = 360 / SLICE_COUNT;
  
  // Adiciona gradientes primeiro
  const defs = createSVGGradients();
  elements.wheel.insertBefore(defs, elements.wheel.firstChild);
  
  for (let i = 0; i < SLICE_COUNT; i++) {
    const start = (i * angle - 90) * (Math.PI / 180);
    const end = ((i + 1) * angle - 90) * (Math.PI / 180);
    const r = 100;
    
    const x1 = 100 + r * Math.cos(start);
    const y1 = 100 + r * Math.sin(start);
    const x2 = 100 + r * Math.cos(end);
    const y2 = 100 + r * Math.sin(end);
    
    // Cria slice com borda dourada
    const path = createSVGElement("path", {
      d: `M 100 100 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`,
      class: i % 2 === 0 ? "win-slice" : "lose-slice",
      style: `fill: url(#${i % 2 === 0 ? 'win' : 'lose'}Gradient); stroke: url(#borderGradient); stroke-width: 2;`
    });
    
    elements.slicesGroup.appendChild(path);
    
    // Cria label com melhor posicionamento
    const labelAngle = (i + 0.5) * angle - 90;
    const lx = 100 + 65 * Math.cos((labelAngle * Math.PI) / 180);
    const ly = 100 + 65 * Math.sin((labelAngle * Math.PI) / 180);
    
    const text = createSVGElement("text", {
      x: lx,
      y: ly,
      class: "slice-label"
    });
    text.textContent = i % 2 === 0 ? "WIN" : "LOSE";
    
    elements.slicesGroup.appendChild(text);
  }
  
  // Adiciona círculo central decorativo
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
  
  // Adiciona linhas divisórias entre slices
  for (let i = 0; i < SLICE_COUNT; i++) {
    const lineAngle = i * angle - 90;
    const x = 100 + 100 * Math.cos((lineAngle * Math.PI) / 180);
    const y = 100 + 100 * Math.sin((lineAngle * Math.PI) / 180);
    
    const line = createSVGElement("line", {
      x1: "100",
      y1: "100",
      x2: x.toString(),
      y2: y.toString(),
      stroke: "url(#borderGradient)",
      "stroke-width": "2",
      opacity: "0.6"
    });
    
    elements.slicesGroup.appendChild(line);
  }
}

// Funções do modal
function openModal(modalType = 'deposit') { 
  const modal = modalType === 'deposit' ? elements.modal : elements.withdrawModal;
  modal.classList.remove("hidden");
  modal.classList.add("show");
  
  if (modalType === 'deposit') {
    elements.depositValue.focus();
  } else {
    elements.withdrawValue.focus();
    updateAvailableBalance();
  }
}

function closeModal(modalType = 'deposit') { 
  const modal = modalType === 'deposit' ? elements.modal : elements.withdrawModal;
  modal.classList.remove("show");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// Atualiza saldo disponível no modal de saque
function updateAvailableBalance() {
  if (elements.availableBalance) {
    elements.availableBalance.textContent = `R$ ${fmt(readBalance())}`;
  }
}

// Função genérica para operações financeiras
function updateBalance(amount, operation = 'add') {
  if (amount <= 0) return false;
  
  const currentBalance = readBalance();
  const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
  
  if (operation === 'subtract' && newBalance < 0) return false;
  
  writeBalance(newBalance);
  setBalanceUI();
  return true;
}

// Funções de depósito e saque
function deposit(amount) { 
  if (updateBalance(amount, 'add')) {
    showNotification(`Depósito de R$ ${fmt(amount)} realizado com sucesso!`, 'success');
  }
}

function withdraw(amount) { 
  if (updateBalance(amount, 'subtract')) {
    showNotification(`Saque de R$ ${fmt(amount)} realizado com sucesso!`, 'success');
  } else {
    showNotification("Saldo insuficiente para saque!", 'error');
  }
}

// Adiciona aposta ao histórico
function addToHistory(bet, outcome, prize, balanceAfter) {
  const history = readHistory();
  const betRecord = {
    id: Date.now(),
    bet: bet,
    outcome: outcome,
    prize: prize,
    balanceAfter: balanceAfter,
    timestamp: new Date(),
    profit: outcome === 'WIN' ? prize - bet : -bet
  };
  
  history.unshift(betRecord);
  
  // Mantém apenas os últimos 50 registros
  if (history.length > 50) {
    history.splice(50);
  }
  
  writeHistory(history);
  updateHistoryUI();
}

// Atualiza interface do histórico
function updateHistoryUI() {
  const history = readHistory();
  const historyContainer = elements.betHistory;
  
  if (!historyContainer) return;
  
  if (history.length === 0) {
    historyContainer.innerHTML = `
      <div class="history-placeholder">
        <i class="fas fa-info-circle"></i>
        <p>Nenhuma aposta realizada ainda</p>
      </div>
    `;
    return;
  }
  
  historyContainer.innerHTML = history.map(record => `
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

// Limpa histórico
function clearHistory() {
  if (confirm("Tem certeza que deseja limpar todo o histórico?")) {
    writeHistory([]);
    updateHistoryUI();
    showNotification("Histórico limpo com sucesso!", 'info');
  }
}

  // Determina resultado baseado na probabilidade dinâmica
  function randomOutcome() { 
    return generateResult(); 
  }

// Mostra resultado em destaque
function showResultDisplay(outcome, amount) {
  if (!elements.resultDisplay || !elements.resultIcon || !elements.resultText || !elements.resultAmount) return;
  
  const icon = outcome === 'WIN' ? '🎉' : '💔';
  const text = outcome === 'WIN' ? 'VITÓRIA!' : 'DERROTA';
  const color = outcome === 'WIN' ? COLORS.success : COLORS.error;
  
  elements.resultIcon.textContent = icon;
  elements.resultText.textContent = text;
  elements.resultAmount.textContent = outcome === 'WIN' ? `+R$ ${fmt(amount)}` : `-R$ ${fmt(amount)}`;
  
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

// Animação visual da roleta
function spinVisualTo(outcome) { 
  const anglePerSlice = 360 / SLICE_COUNT;
  const candidateIndexes = [];
  
  for (let i = 0; i < SLICE_COUNT; i++) {
    const isWin = i % 2 === 0;
    if ((outcome === "WIN" && isWin) || (outcome === "LOSE" && !isWin)) {
      candidateIndexes.push(i);
    }
  }
  
  const idx = candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)];
  const fullSpins = 4;
  const targetAngle = fullSpins * 360 + idx * anglePerSlice + anglePerSlice / 2;
  
  elements.wheel.style.transform = `rotate(-22.5deg) rotate(${targetAngle}deg)`;
  elements.wheel.classList.add("spin");
  
  return new Promise(resolve => setTimeout(resolve, 2500));
}

// Função principal do jogo
async function play() { 
  if (spinning) return;
  
  const bet = Math.max(1, Number(elements.betInput.value || 0));
  const currentBalance = readBalance();
  
  if (bet > currentBalance) {
    showNotification("Saldo insuficiente para esta aposta!", 'error');
    return;
  }
  
  // Estado de loading
  spinning = true;
  elements.btnPlay.disabled = true;
  elements.lastResult.textContent = "Girando...";
  elements.lastResult.style.color = COLORS.warning;
  
  // Toca som de giro
  playSound('spin');
  
  const outcome = randomOutcome();
  await spinVisualTo(outcome);
  
  // Atualiza o estado do jogo para probabilidade dinâmica
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
  
  // Atualiza a interface com informações de probabilidade
  updateProbabilityUI();
  
  // Reset do estado
  setBalanceUI();
  elements.wheel.classList.remove("spin");
  elements.wheel.style.transform = "rotate(-22.5deg)";
  spinning = false;
  elements.btnPlay.disabled = false;
}

// Sistema de notificações otimizado
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
}

// Toggle do menu dropdown
function toggleProfileDropdown() {
  if (elements.profileDropdown) {
    elements.profileDropdown.classList.toggle('show');
  }
}

// Event listeners
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
    elements.depositValue.value = "100"; // Reset para valor padrão
  } else {
    showNotification("Por favor, insira um valor válido!", 'error');
  }
});

elements.confirmWithdraw.addEventListener("click", () => { 
  const amount = Number(elements.withdrawValue.value || 0);
  if (amount > 0) {
    withdraw(amount);
    closeModal('withdraw');
    elements.withdrawValue.value = "50"; // Reset para valor padrão
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

// Inicialização
(function boot() { 
  if (localStorage.getItem(STORAGE_KEY) === null) {
    writeBalance(0);
  }
  loadGameState(); // Carrega estado do jogo salvo
  setBalanceUI();
  drawWheel();
  updateHistoryUI();
  updateProbabilityUI(); // Inicializa interface de probabilidade
})();