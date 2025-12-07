// ====== Basic snake game ======
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const scoreLabel = document.getElementById('scoreLabel');
const speedRange = document.getElementById('speedRange');
const touchPad = document.getElementById('touchPad');

// Grid settings
const GRID_COLS = 30;
const GRID_ROWS = 30;
let gridSize = 20; // computed from canvas size
let scale = Math.min(canvas.width / GRID_COLS, canvas.height / GRID_ROWS);

// Game state
let snake = [];
let dir = {x:1,y:0}; // initial moving right
let nextDir = {x:1,y:0};
let apple = null;
let score = 0;
let running = false;
let paused = false;
let gameLoopId = null;
let speed = Number(speedRange.value); // ticks per second
let mode = 'apple'; // or 'gold'

// initialize
function resizeGrid(){
  scale = Math.floor(Math.min(canvas.width / GRID_COLS, canvas.height / GRID_ROWS));
  gridSize = scale;
}
resizeGrid();

function resetGame(){
  snake = [
    {x: Math.floor(GRID_COLS/2)-1, y: Math.floor(GRID_ROWS/2)},
    {x: Math.floor(GRID_COLS/2),   y: Math.floor(GRID_ROWS/2)}
  ];
  dir = {x:1,y:0};
  nextDir = {x:1,y:0};
  placeApple();
  score = 0;
  updateScore();
  paused = false;
}

function placeApple(){
  // place on empty cell
  let valid = false;
  let a;
  while(!valid){
    a = { x: Math.floor(Math.random()*GRID_COLS), y: Math.floor(Math.random()*GRID_ROWS) };
    valid = !snake.some(s => s.x===a.x && s.y===a.y);
  }
  apple = a;
}

function updateScore(){ scoreLabel.textContent = 'Skor: ' + score; }

function draw(){
  // clear
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // background grid (subtle)
  ctx.fillStyle = '#06121a';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // draw apple (fruit)
  if(apple){
    const ax = apple.x * scale;
    const ay = apple.y * scale;
    if(mode === 'apple'){
      // red apple
      ctx.fillStyle = '#ff6666';
      roundRect(ctx, ax+2, ay+2, scale-4, scale-4, 6);
      ctx.fill();
      // highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(ax+scale*0.55, ay+scale*0.12, scale*0.18, scale*0.18);
    } else {
      // gold star-like fruit
      ctx.fillStyle = '#ffd86b';
      roundRect(ctx, ax+2, ay+2, scale-4, scale-4, 6);
      ctx.fill();
      ctx.fillStyle = '#fff2cc';
      ctx.fillRect(ax+scale*0.5, ay+scale*0.2, scale*0.12, scale*0.12);
    }
  }

  // draw snake
  for(let i=0;i<snake.length;i++){
    const s = snake[i];
    const x = s.x*scale;
    const y = s.y*scale;
    // head style
    if(i===snake.length-1){
      const gradient = ctx.createLinearGradient(x,y,x+scale,y+scale);
      gradient.addColorStop(0,'#00ffa3');
      gradient.addColorStop(1,'#00a6ff');
      ctx.fillStyle = gradient;
      roundRect(ctx, x+1, y+1, scale-2, scale-2, 6);
      ctx.fill();
    } else {
      ctx.fillStyle = '#04856e';
      roundRect(ctx, x+2, y+2, scale-4, scale-4, 5);
      ctx.fill();
    }
  }

  // border
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0.5,0.5,GRID_COLS*scale-1,GRID_ROWS*scale-1);
}

// utility: rounded rectangle
function roundRect(ctx,x,y,w,h,r){
  const radius = r;
  ctx.beginPath();
  ctx.moveTo(x+radius,y);
  ctx.arcTo(x+w,y,x+w,y+h,radius);
  ctx.arcTo(x+w,y+h,x,y+h,radius);
  ctx.arcTo(x,y+h,x,y,radius);
  ctx.arcTo(x,y,x+w,y,radius);
  ctx.closePath();
}

// game tick
function tick(){
  if(!running || paused) return;
  // apply next dir (prevent reverse)
  if((nextDir.x !== -dir.x || nextDir.y !== -dir.y) ){
    dir = nextDir;
  }

  const head = {...snake[snake.length-1]};
  head.x += dir.x;
  head.y += dir.y;

  // wall collision => game over
  if(head.x < 0 || head.x >= GRID_COLS || head.y < 0 || head.y >= GRID_ROWS){
    return gameOver();
  }

  // self collision
  if(snake.some(s => s.x===head.x && s.y===head.y)){
    return gameOver();
  }

  // move snake
  snake.push(head);

  // eat apple?
  if(head.x === apple.x && head.y === apple.y){
    // grow and increase score
    score += (mode==='apple') ? 10 : 30;
    // maybe change mode randomly
    if(Math.random() < 0.12) mode = (mode==='apple') ? 'gold' : 'apple';
    placeApple();
    updateScore();
  } else {
    // remove tail
    snake.shift();
  }
  draw();
}

function gameOver(){
  running = false;
  paused = false;
  updateScore();
  // flash effect & text
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = Math.floor(scale*2.2) + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 10);
  ctx.font = '18px system-ui';
  ctx.fillText('Tekan Restart untuk main lagi', canvas.width/2, canvas.height/2 + 22);
}

// game loop with variable speed (ticks per second)
let lastTick = 0;
function loop(ts){
  if(!lastTick) lastTick = ts;
  const interval = 1000 / speed; // ms per tick
  if(ts - lastTick >= interval){
    lastTick = ts;
    tick();
  }
  gameLoopId = requestAnimationFrame(loop);
}

// input handling
window.addEventListener('keydown', e=>{
  const k = e.key.toLowerCase();
  if(['arrowup','w','arrowdown','s','arrowleft','a','arrowright','d'].includes(k) || ['w','a','s','d'].includes(k)){
    e.preventDefault();
  }
  if(k === 'arrowup' || k === 'w') nextDir = {x:0,y:-1};
  if(k === 'arrowdown' || k === 's') nextDir = {x:0,y:1};
  if(k === 'arrowleft' || k === 'a') nextDir = {x:-1,y:0};
  if(k === 'arrowright' || k === 'd') nextDir = {x:1,y:0};

  // space to pause
  if(e.key === ' '){
    togglePause();
  }
});

// touch pad clicks
touchPad.addEventListener('pointerdown', e=>{
  const btn = e.target.closest('.pad-btn');
  if(!btn) return;
  const d = btn.dataset.dir;
  if(d === 'up') nextDir = {x:0,y:-1};
  if(d === 'down') nextDir = {x:0,y:1};
  if(d === 'left') nextDir = {x:-1,y:0};
  if(d === 'right') nextDir = {x:1,y:0};
});

// optional swipe support for full canvas
let touchStart = null;
canvas.addEventListener('pointerdown', e=>{
  touchStart = {x:e.clientX, y:e.clientY};
});
canvas.addEventListener('pointerup', e=>{
  if(!touchStart) return;
  const dx = e.clientX - touchStart.x;
  const dy = e.clientY - touchStart.y;
  if(Math.abs(dx) > 20 || Math.abs(dy) > 20){
    if(Math.abs(dx) > Math.abs(dy)){
      nextDir = dx > 0 ? {x:1,y:0} : {x:-1,y:0};
    } else {
      nextDir = dy > 0 ? {x:0,y:1} : {x:0,y:-1};
    }
  }
  touchStart = null;
});

// UI buttons
startBtn.addEventListener('click', ()=>{
  if(!running){
    running = true;
    paused = false;
    if(!gameLoopId) gameLoopId = requestAnimationFrame(loop);
    startBtn.textContent = 'Sedang Main...';
  }
});

pauseBtn.addEventListener('click', togglePause);

resetBtn.addEventListener('click', ()=>{
  running = true;
  paused = false;
  resetGame();
  if(!gameLoopId) gameLoopId = requestAnimationFrame(loop);
  startBtn.textContent = 'Sedang Main...';
});

function togglePause(){
  if(!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? 'Lanjutkan' : 'Pause';
}

speedRange.addEventListener('input', e=>{
  speed = Number(e.target.value);
});

// mode buttons
document.getElementById('appleMode').addEventListener('click', ()=>{
  mode = 'apple';
});
document.getElementById('goldMode').addEventListener('click', ()=>{
  mode = 'gold';
});

// initial setup