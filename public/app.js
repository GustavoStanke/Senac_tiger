const STORAGE_KEY = "senac_roleta_balance";
const HOUSE_PROB = { lose: 0.65, win: 0.35 };
const MULTIPLIER = 2;
const SLICE_COUNT = 8;
let spinning = false;
const fmt = (n) => (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const readBalance = () => { const b = Number(localStorage.getItem(STORAGE_KEY)); return isNaN(b) ? 0 : b; };
const writeBalance = (v) => localStorage.setItem(STORAGE_KEY, String(v));
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
function setBalanceUI(){ balanceEl.textContent = fmt(readBalance()); }
function drawWheel(){ slicesGroup.innerHTML=""; const angle=360/SLICE_COUNT; for(let i=0;i<SLICE_COUNT;i++){ const start=(i*angle-90)*(Math.PI/180); const end=((i+1)*angle-90)*(Math.PI/180); const r=100; const x1=100+r*Math.cos(start); const y1=100+r*Math.sin(start); const x2=100+r*Math.cos(end); const y2=100+r*Math.sin(end); const path=document.createElementNS("http://www.w3.org/2000/svg","path"); path.setAttribute("d",`M 100 100 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`); slicesGroup.appendChild(path); const labelAngle=(i+0.5)*angle-90; const lx=100+60*Math.cos((labelAngle*Math.PI)/180); const ly=100+60*Math.sin((labelAngle*Math.PI)/180); const text=document.createElementNS("http://www.w3.org/2000/svg","text"); text.setAttribute("x",lx); text.setAttribute("y",ly); text.setAttribute("class","slice-label"); text.textContent=i%2===0?"WIN":"LOSE"; slicesGroup.appendChild(text); }};
function openModal(){ modal.classList.remove("hidden"); depositValue.focus(); }
function closeModal(){ modal.classList.add("hidden"); }
function deposit(v){ if(v<=0)return; const newBalance=readBalance()+v; writeBalance(newBalance); setBalanceUI(); }
function withdraw(v){ if(v<=0)return; const b=readBalance(); const val=Math.min(v,b); writeBalance(b-val); setBalanceUI(); }
function randomOutcome(){ return Math.random()<HOUSE_PROB.lose?"LOSE":"WIN"; }
function spinVisualTo(outcome){ const anglePerSlice=360/SLICE_COUNT; let candidateIndexes=[]; for(let i=0;i<SLICE_COUNT;i++){ const isWin=i%2===0; if((outcome==="WIN"&&isWin)||(outcome==="LOSE"&&!isWin)){ candidateIndexes.push(i);} } const idx=candidateIndexes[Math.floor(Math.random()*candidateIndexes.length)]; const fullSpins=4; const targetAngle=fullSpins*360+idx*anglePerSlice+anglePerSlice/2; wheel.style.transform=`rotate(-22.5deg) rotate(${targetAngle}deg)`; wheel.classList.add("spin"); return new Promise(r=>setTimeout(r,2300)); }
async function play(){ if(spinning)return; const bet=Math.max(1,Number(betInput.value||0)); const b=readBalance(); if(bet>b){ lastResult.textContent="Saldo insuficiente."; return; } spinning=true; btnPlay.disabled=true; lastResult.textContent="Girando..."; const outcome=randomOutcome(); await spinVisualTo(outcome); if(outcome==="WIN"){ const prize=bet*MULTIPLIER; writeBalance(b-bet+prize); lastResult.textContent=`WIN! +R$${fmt(prize-bet)}`; } else { writeBalance(b-bet); lastResult.textContent=`LOSE! -R$${fmt(bet)}`; } setBalanceUI(); wheel.classList.remove("spin"); wheel.style.transform="rotate(-22.5deg)"; spinning=false; btnPlay.disabled=false; }
btnDeposit.addEventListener("click",openModal);
cancelDeposit.addEventListener("click",closeModal);
confirmDeposit.addEventListener("click",()=>{ const v=Number(depositValue.value||0); if(v>0)deposit(v); closeModal(); });
btnWithdraw.addEventListener("click",()=>{ const v=Number(prompt("Valor para saque (R$):","50")||0); if(v>0)withdraw(v); });
btnPlay.addEventListener("click",play);
(function boot(){ if(localStorage.getItem(STORAGE_KEY)===null){ writeBalance(0);} setBalanceUI(); drawWheel(); })();