// --- 요소 참조 ---
const board = document.getElementById('board');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const difficultySel = document.getElementById('difficulty');
const durationSel = document.getElementById('duration');
const scoreEl = document.getElementById('score');
const missEl = document.getElementById('miss');
const accEl = document.getElementById('acc');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');
const toast = document.getElementById('toast');

const DIFF = {
  easy:   { size: 60, interval: 1200 },
  normal: { size: 46, interval: 900 },
  hard:   { size: 34, interval: 650 },
  insane: { size: 28, interval: 500 }
};

let score=0, miss=0, timeLeft=+durationSel.value, running=false;
let spawnTimer=null, countdownTimer=null, currentDot=null;

// 최고점 키
const bestKey = () => `ctd-best-${difficultySel.value}-${durationSel.value}`;
const loadBest = () => bestEl.textContent = localStorage.getItem(bestKey()) || '-';
const saveBestIfNeeded = () => {
  const prev = +(localStorage.getItem(bestKey()) || 0);
  if (score > prev) { localStorage.setItem(bestKey(), String(score)); loadBest(); showToast('🎉 New Best!'); }
};

function accuracy(){ const t=score+miss; return t? Math.round((score/t)*100) : 0; }
function updateStats(){ scoreEl.textContent=score; missEl.textContent=miss; accEl.textContent=accuracy()+'%'; timeEl.textContent=timeLeft; }

function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),1400); }

function stopTimers(){ clearInterval(spawnTimer); clearInterval(countdownTimer); spawnTimer=null; countdownTimer=null; }
function removeDot(){ if(currentDot?.parentNode) currentDot.parentNode.removeChild(currentDot); currentDot=null; }

function resetState(){
  stopTimers(); running=false; score=0; miss=0; timeLeft=+durationSel.value;
  difficultySel.disabled=false; durationSel.disabled=false;
  removeDot(); loadBest(); updateStats();
}

function endGame(){ running=false; stopTimers(); removeDot(); saveBestIfNeeded(); difficultySel.disabled=false; durationSel.disabled=false; showToast(`끝! Score ${score} • Acc ${accuracy()}%`); }

// 점 생성
function spawnDot(){
  if(!running) return;
  if(currentDot) { miss++; updateStats(); removeDot(); }

  const { size } = DIFF[difficultySel.value];
  const rect = board.getBoundingClientRect();
  const w = rect.width || board.clientWidth || 640;
  const h = rect.height || board.clientHeight || 360;
  const pad=8;
  const left = Math.floor(pad + Math.random() * Math.max(w - size - pad, pad));
  const top  = Math.floor(pad + Math.random() * Math.max(h - size - pad, pad));

  const dot = document.createElement('button');
  dot.type='button';
  dot.className='dot pulse';
  Object.assign(dot.style,{width:size+'px',height:size+'px',left:left+'px',top:top+'px'});
  dot.setAttribute('aria-label','target dot');

  // 클릭 처리
  const hit = (e)=>{ e.preventDefault(); if(!running) return;
    score++; updateStats(); dot.disabled=true; dot.style.transform='scale(.85)'; dot.style.opacity='.7';
    setTimeout(()=>{ if(currentDot===dot) removeDot(); }, 40);
  };
  dot.addEventListener('click', hit, {passive:false});
  dot.addEventListener('touchstart', hit, {passive:false});

  removeDot();
  board.appendChild(dot);
  currentDot = dot;
}

// 시작/일시정지/리셋
function startGame(){
  if(running) return;
  if(board.offsetHeight < 120) board.style.minHeight='420px'; // 레이아웃 보호
  running = true; toast.classList.remove('show');
  difficultySel.disabled=true; durationSel.disabled=true;
  const { interval } = DIFF[difficultySel.value];
  spawnTimer = setInterval(spawnDot, interval);
  countdownTimer = setInterval(()=>{ timeLeft--; timeEl.textContent=timeLeft; if(timeLeft<=0) endGame(); },1000);
  spawnDot();
}
function pauseGame(){ if(!running) return; running=false; stopTimers(); showToast('⏸ Paused'); }

startBtn.addEventListener('click', ()=>{ if(timeLeft<=0) resetState(); startGame(); });
pauseBtn.addEventListener('click', pauseGame);
resetBtn.addEventListener('click', ()=>{ resetState(); showToast('리셋됨'); });
difficultySel.addEventListener('change', resetState);
durationSel.addEventListener('change', resetState);
window.addEventListener('resize', ()=>{ if(currentDot) removeDot(); });
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && running) pauseGame(); });

// 초기화
loadBest(); updateStats();
