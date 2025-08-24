const STORAGE_KEY = "senac_roleta_balance";
const HOUSE_PROB = { lose: 0.65, win: 0.35 };
const MULTIPLIER = 2;
const SLICE_COUNT = 8;
let spinning = false;

// Formatação de números
const fmt = (n) => (n || 0).toLocaleString("pt-BR", { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
});

// Funções de localStorage
const readBalance = () => { 
  const b = Number(localStorage.getItem(STORAGE_KEY)); 
  return isNaN(b) ? 0 : b; 
};

const writeBalance = (v) => localStorage.setItem(STORAGE_KEY, String(v));

// Elementos DOM
const balanceEl = document.getElementById("balance");
const btnDeposit = document.getElementById("btn-deposit");
const btnWithdraw = document.getElementById("btn-withdraw");
const btnPlay = document.getElementById("btn-play");
const betInput = document.getElementById("bet-amount");
const lastResult = document.getElementById("last-result");
const modal = document.getElementById("modal");
const depositValue = document.getElementById("deposit-value");
const confirmDeposit = document.getElementById("confirm-deposit");
const cancelDeposit = document.getElementById("cancel-deposit");
const wheel = document.getElementById("wheel");
const slicesGroup = document.getElementById("slices");

// Atualiza UI do saldo
function setBalanceUI() { 
  balanceEl.textContent = fmt(readBalance()); 
  
  // Adiciona animação de atualização
  balanceEl.style.transform = "scale(1.1)";
  balanceEl.style.color = "#22c55e";
  setTimeout(() => {
    balanceEl.style.transform = "scale(1)";
    balanceEl.style.color = "#22c55e";
  }, 200);
}

// Desenha a roleta
function drawWheel() {
  slicesGroup.innerHTML = "";
  const angle = 360 / SLICE_COUNT;
  
  for (let i = 0; i < SLICE_COUNT; i++) {
    const start = (i * angle - 90) * (Math.PI / 180);
    const end = ((i + 1) * angle - 90) * (Math.PI / 180);
    const r = 100;
    
    const x1 = 100 + r * Math.cos(start);
    const y1 = 100 + r * Math.sin(start);
    const x2 = 100 + r * Math.cos(end);
    const y2 = 100 + r * Math.sin(end);
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M 100 100 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`);
    
    // Adiciona cores alternadas para WIN/LOSE
    if (i % 2 === 0) {
      path.setAttribute("class", "win-slice");
      path.style.fill = "url(#winGradient)";
    } else {
      path.setAttribute("class", "lose-slice");
      path.style.fill = "url(#loseGradient)";
    }
    
    slicesGroup.appendChild(path);
    
    // Labels das seções
    const labelAngle = (i + 0.5) * angle - 90;
    const lx = 100 + 60 * Math.cos((labelAngle * Math.PI) / 180);
    const ly = 100 + 60 * Math.sin((labelAngle * Math.PI) / 180);
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", lx);
    text.setAttribute("y", ly);
    text.setAttribute("class", "slice-label");
    text.textContent = i % 2 === 0 ? "WIN" : "LOSE";
    slicesGroup.appendChild(text);
  }
  
  // Adiciona gradientes SVG
  addSVGGradients();
}

// Adiciona gradientes SVG para as cores
function addSVGGradients() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  
  // Gradiente para WIN
  const winGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  winGradient.setAttribute("id", "winGradient");
  winGradient.setAttribute("x1", "0%");
  winGradient.setAttribute("y1", "0%");
  winGradient.setAttribute("x2", "100%");
  winGradient.setAttribute("y2", "100%");
  
  const winStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  winStop1.setAttribute("offset", "0%");
  winStop1.setAttribute("stop-color", "#22c55e");
  
  const winStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  winStop2.setAttribute("offset", "100%");
  winStop2.setAttribute("stop-color", "#16a34a");
  
  winGradient.appendChild(winStop1);
  winGradient.appendChild(winStop2);
  
  // Gradiente para LOSE
  const loseGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  loseGradient.setAttribute("id", "loseGradient");
  loseGradient.setAttribute("x1", "0%");
  loseGradient.setAttribute("y1", "0%");
  loseGradient.setAttribute("x2", "100%");
  loseGradient.setAttribute("y2", "100%");
  
  const loseStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  loseStop1.setAttribute("offset", "0%");
  loseStop1.setAttribute("stop-color", "#ef4444");
  
  const loseStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  loseStop2.setAttribute("offset", "100%");
  loseStop2.setAttribute("stop-color", "#dc2626");
  
  loseGradient.appendChild(loseStop1);
  loseGradient.appendChild(loseStop2);
  
  defs.appendChild(winGradient);
  defs.appendChild(loseGradient);
  
  // Insere os gradientes no início do SVG
  wheel.insertBefore(defs, wheel.firstChild);
}

// Modal functions
function openModal() { 
  modal.classList.remove("hidden");
  modal.classList.add("show");
  depositValue.focus();
  
  // Adiciona efeito de entrada
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);
}

function closeModal() { 
  modal.classList.remove("show");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// Funções de depósito e saque
function deposit(v) { 
  if (v <= 0) return;
  
  const newBalance = readBalance() + v;
  writeBalance(newBalance);
  setBalanceUI();
  
  // Feedback visual
  showNotification(`Depósito de R$ ${fmt(v)} realizado com sucesso!`, 'success');
}

function withdraw(v) { 
  if (v <= 0) return;
  
  const b = readBalance();
  const val = Math.min(v, b);
  
  if (val === 0) {
    showNotification("Saldo insuficiente para saque!", 'error');
    return;
  }
  
  writeBalance(b - val);
  setBalanceUI();
  
  // Feedback visual
  showNotification(`Saque de R$ ${fmt(val)} realizado com sucesso!`, 'success');
}

// Determina resultado aleatório
function randomOutcome() { 
  return Math.random() < HOUSE_PROB.lose ? "LOSE" : "WIN"; 
}

// Animação visual da roleta
function spinVisualTo(outcome) { 
  const anglePerSlice = 360 / SLICE_COUNT;
  let candidateIndexes = [];
  
  for (let i = 0; i < SLICE_COUNT; i++) {
    const isWin = i % 2 === 0;
    if ((outcome === "WIN" && isWin) || (outcome === "LOSE" && !isWin)) {
      candidateIndexes.push(i);
    }
  }
  
  const idx = candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)];
  const fullSpins = 4;
  const targetAngle = fullSpins * 360 + idx * anglePerSlice + anglePerSlice / 2;
  
  wheel.style.transform = `rotate(-22.5deg) rotate(${targetAngle}deg)`;
  wheel.classList.add("spin");
  
  return new Promise(r => setTimeout(r, 2500));
}

// Função principal do jogo
async function play() { 
  if (spinning) return;
  
  const bet = Math.max(1, Number(betInput.value || 0));
  const b = readBalance();
  
  if (bet > b) {
    showNotification("Saldo insuficiente para esta aposta!", 'error');
    return;
  }
  
  spinning = true;
  btnPlay.disabled = true;
  lastResult.textContent = "Girando...";
  lastResult.style.color = "#f59e0b";
  
  const outcome = randomOutcome();
  await spinVisualTo(outcome);
  
  if (outcome === "WIN") {
    const prize = bet * MULTIPLIER;
    writeBalance(b - bet + prize);
    lastResult.textContent = `🎉 WIN! +R$ ${fmt(prize - bet)}`;
    lastResult.style.color = "#22c55e";
    showNotification(`Parabéns! Você ganhou R$ ${fmt(prize - bet)}!`, 'success');
  } else {
    writeBalance(b - bet);
    lastResult.textContent = `💔 LOSE! -R$ ${fmt(bet)}`;
    lastResult.style.color = "#ef4444";
    showNotification(`Que pena! Você perdeu R$ ${fmt(bet)}.`, 'error');
  }
  
  setBalanceUI();
  wheel.classList.remove("spin");
  wheel.style.transform = "rotate(-22.5deg)";
  spinning = false;
  btnPlay.disabled = false;
}

// Sistema de notificações
function showNotification(message, type = 'info') {
  // Remove notificação anterior se existir
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
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Remove após 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Event listeners
btnDeposit.addEventListener("click", openModal);
cancelDeposit.addEventListener("click", closeModal);

confirmDeposit.addEventListener("click", () => { 
  const v = Number(depositValue.value || 0);
  if (v > 0) {
    deposit(v);
    closeModal();
    depositValue.value = "100"; // Reset para valor padrão
  } else {
    showNotification("Por favor, insira um valor válido!", 'error');
  }
});

btnWithdraw.addEventListener("click", () => { 
  const v = Number(prompt("Valor para saque (R$):", "50") || 0);
  if (v > 0) withdraw(v);
});

btnPlay.addEventListener("click", play);

// Fecha modal ao clicar fora
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Fecha modal com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

// Inicialização
(function boot() { 
  if (localStorage.getItem(STORAGE_KEY) === null) {
    writeBalance(0);
  }
  setBalanceUI();
  drawWheel();
})();