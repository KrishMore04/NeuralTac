
const $ = id => document.getElementById(id);

/* TIC-TAC-TOE: MINIMAX + ALPHA-BETA */

const cells = [...document.querySelectorAll(".cell")];
const gameStatus = $("gameStatus");
const difficulty = $("difficulty");

let board = Array(9).fill("");
let gameOver = false;
let scores = { X: 0, O: 0, draw: 0 };
let moves = 0;

const winLines = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

function gameWinner(state) {
  for (const [a,b,c] of winLines) {
    if (state[a] && state[a] === state[b] && state[b] === state[c]) {
      return state[a];
    }
  }
  return state.every(Boolean) ? "draw" : null;
}

function minimax(state, maximizing, alpha, beta, depth = 0) {
  const result = gameWinner(state);

  if (result === "O") return 10 - depth;
  if (result === "X") return depth - 10;
  if (result === "draw") return 0;

  if (maximizing) {
    let best = -Infinity;

    for (let i = 0; i < 9; i++) {
      if (!state[i]) {
        state[i] = "O";
        best = Math.max(best, minimax(state, false, alpha, beta, depth + 1));
        state[i] = "";
        alpha = Math.max(alpha, best);
        if (alpha >= beta) break;
      }
    }
    return best;
  }

  let best = Infinity;

  for (let i = 0; i < 9; i++) {
    if (!state[i]) {
      state[i] = "X";
      best = Math.min(best, minimax(state, true, alpha, beta, depth + 1));
      state[i] = "";
      beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
  }
  return best;
}

function bestAIMove() {
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = "O";
      const score = minimax(board, false, -Infinity, Infinity);
      board[i] = "";

      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function randomMove() {
  const empty = board.map((v, i) => v ? -1 : i).filter(i => i >= 0);
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : -1;
}

function renderGame() {
  cells.forEach((cell, i) => {
    cell.textContent = board[i];
    cell.disabled = gameOver || Boolean(board[i]);
    cell.setAttribute("aria-label", `Cell ${i + 1}${board[i] ? ": " + board[i] : ""}`);
  });

  $("playerScore").textContent = scores.X;
  $("aiScore").textContent = scores.O;
  $("drawScore").textContent = scores.draw;
  $("moveCount").textContent = moves;
}

function finishGame() {
  const result = gameWinner(board);
  if (!result) return false;

  gameOver = true;
  if (result === "X") {
    scores.X++;
    gameStatus.textContent = "Congratulations! You win!";
  } else if (result === "O") {
    scores.O++;
    gameStatus.textContent = "AI wins! Try again.";
  } else {
    scores.draw++;
    gameStatus.textContent = "It's a draw!";
  }

  renderGame();
  return true;
}

function playerMove(index) {
  if (gameOver || board[index]) return;

  board[index] = "X";
  moves++;
  renderGame();

  if (finishGame()) return;

  gameStatus.textContent = "AI is thinking...";

  let move;
  const level = difficulty.value;

  if (level === "easy" && Math.random() < 0.7) {
    move = randomMove();
  } else if (level === "medium" && Math.random() < 0.3) {
    move = randomMove();
  } else {
    move = bestAIMove();
  }

  if (move >= 0) {
    board[move] = "O";
    moves++;
  }

  renderGame();

  if (!finishGame()) gameStatus.textContent = "Your turn — you are X";
}

cells.forEach((cell, i) => {
  cell.addEventListener("click", () => playerMove(i));
});

$("newGame").addEventListener("click", () => {
  board = Array(9).fill("");
  gameOver = false;
  moves = 0;
  gameStatus.textContent = "Your turn — you are X";
  renderGame();
});


/* A* PATHFINDING */

const ROWS = 12;
const COLS = 12;
const START = 0;
const GOAL = ROWS * COLS - 1;

let walls = new Set();
let mazeNodes = [];
let mazeBusy = false;

function heuristic(a, b) {
  return Math.abs(Math.floor(a / COLS) - Math.floor(b / COLS)) +
         Math.abs((a % COLS) - (b % COLS));
}

function renderMaze(visited = new Set(), path = new Set()) {
  const maze = $("maze");
  maze.replaceChildren();
  mazeNodes = [];

  for (let i = 0; i < ROWS * COLS; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "maze-cell";
    cell.setAttribute("aria-label", `Grid cell ${i + 1}`);

    if (walls.has(i)) cell.classList.add("wall");
    if (visited.has(i)) cell.classList.add("visited");
    if (path.has(i)) cell.classList.add("path");
    if (i === START) cell.className = "maze-cell start";
    if (i === GOAL) cell.className = "maze-cell goal";

    cell.addEventListener("click", () => {
      if (mazeBusy || i === START || i === GOAL) return;

      if (walls.has(i)) walls.delete(i);
      else walls.add(i);

      renderMaze();
      $("pathLength").textContent = "—";
      $("nodesExplored").textContent = "—";
      $("mazeStatus").textContent = "Wall updated. Find a path to solve.";
    });

    maze.appendChild(cell);
    mazeNodes.push(cell);
  }
}

function neighbors(index) {
  const r = Math.floor(index / COLS);
  const c = index % COLS;
  const out = [];

  if (r > 0) out.push(index - COLS);
  if (r < ROWS - 1) out.push(index + COLS);
  if (c > 0) out.push(index - 1);
  if (c < COLS - 1) out.push(index + 1);

  return out.filter(n => !walls.has(n));
}

function aStar() {
  const open = new Set([START]);
  const cameFrom = new Map();
  const g = new Map([[START, 0]]);
  const f = new Map([[START, heuristic(START, GOAL)]]);
  const visited = new Set();

  while (open.size) {
    let current = -1;
    let lowest = Infinity;

    for (const node of open) {
      if ((f.get(node) ?? Infinity) < lowest) {
        lowest = f.get(node);
        current = node;
      }
    }

    if (current === GOAL) {
      const path = new Set();
      let node = GOAL;

      while (node !== START) {
        path.add(node);
        node = cameFrom.get(node);
        if (node === undefined) break;
      }

      path.add(START);
      return { path, visited, length: path.size };
    }

    open.delete(current);
    visited.add(current);

    for (const next of neighbors(current)) {
      const tentative = g.get(current) + 1;

      if (tentative < (g.get(next) ?? Infinity)) {
        cameFrom.set(next, current);
        g.set(next, tentative);
        f.set(next, tentative + heuristic(next, GOAL));
        open.add(next);
      }
    }
  }

  return { path: new Set(), visited, length: 0 };
}

$("solveMaze").addEventListener("click", () => {
  if (mazeBusy) return;

  const result = aStar();
  renderMaze(result.visited, result.path);

  $("nodesExplored").textContent = result.visited.size;
  $("pathLength").textContent = result.length ? result.length - 1 : "No path";
  $("mazeStatus").textContent = result.length
    ? `Path found! ${result.length - 1} steps from start to goal.`
    : "No path found. Remove some walls and try again.";
});

$("randomMaze").addEventListener("click", () => {
  walls.clear();

  for (let i = 1; i < GOAL; i++) {
    if (Math.random() < 0.25) walls.add(i);
  }

  renderMaze();
  $("pathLength").textContent = "—";
  $("nodesExplored").textContent = "—";
  $("mazeStatus").textContent = "Random obstacles generated.";
});

$("clearMaze").addEventListener("click", () => {
  walls.clear();
  renderMaze();
  $("pathLength").textContent = "—";
  $("nodesExplored").textContent = "—";
  $("mazeStatus").textContent = "Walls cleared. Ready to search.";
});


/* HILL CLIMBING OPTIMIZATION */

const canvas = $("hillChart");
const ctx = canvas.getContext("2d");

function objective(x) {
  return Math.sin(1.5 * x) + Math.cos(0.5 * x) + 0.08 * x;
}

let hillTrail = [];
let hillDone = false;

function drawHill() {
  const w = canvas.width;
  const h = canvas.height;
  const pad = 36;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0d1524";
  ctx.fillRect(0, 0, w, h);

  const minX = -10;
  const maxX = 10;
  const values = [];

  for (let i = 0; i <= 200; i++) {
    const x = minX + (maxX - minX) * i / 200;
    values.push({ x, y: objective(x) });
  }

  const minY = Math.min(...values.map(p => p.y)) - 0.4;
  const maxY = Math.max(...values.map(p => p.y)) + 0.4;

  const px = x => pad + (x - minX) / (maxX - minX) * (w - 2 * pad);
  const py = y => h - pad - (y - minY) / (maxY - minY) * (h - 2 * pad);

  ctx.strokeStyle = "#29364d";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = pad + i * (h - 2 * pad) / 4;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.strokeStyle = "#70a5ff";
  ctx.lineWidth = 3;

  values.forEach((p, i) => {
    if (i === 0) ctx.moveTo(px(p.x), py(p.y));
    else ctx.lineTo(px(p.x), py(p.y));
  });

  ctx.stroke();

  if (hillTrail.length) {
    ctx.beginPath();
    ctx.strokeStyle = "#b39aff";
    ctx.lineWidth = 2;

    hillTrail.forEach((p, i) => {
      if (i === 0) ctx.moveTo(px(p.x), py(p.y));
      else ctx.lineTo(px(p.x), py(p.y));
    });

    ctx.stroke();

    const last = hillTrail[hillTrail.length - 1];
    ctx.beginPath();
    ctx.fillStyle = "#48d6a0";
    ctx.arc(px(last.x), py(last.y), 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#9ba9c1";
  ctx.font = "12px Arial";
  ctx.fillText("Objective value", 8, 17);
  ctx.fillText("Position x", w - 90, h - 8);
  ctx.fillText("-10", pad - 8, h - 12);
  ctx.fillText("10", w - pad - 10, h - 12);
}

function runHillClimbing() {
  let x = Math.random() * 18 - 9;
  let y = objective(x);
  const step = 0.1;
  let iterations = 0;

  hillTrail = [{ x, y }];

  while (iterations < 1000) {
    const leftX = Math.max(-10, x - step);
    const rightX = Math.min(10, x + step);
    const leftY = objective(leftX);
    const rightY = objective(rightX);

    if (leftY > y && leftY >= rightY) {
      x = leftX;
      y = leftY;
    } else if (rightY > y) {
      x = rightX;
      y = rightY;
    } else {
      break;
    }

    hillTrail.push({ x, y });
    iterations++;
  }

  hillDone = true;
  $("hillX").textContent = x.toFixed(2);
  $("hillValue").textContent = y.toFixed(4);
  $("hillIterations").textContent = iterations;
  $("hillStatus").textContent =
    "Search stopped at a local maximum: no neighboring step improved the result.";

  drawHill();
}

$("runHill").addEventListener("click", runHillClimbing);

$("resetHill").addEventListener("click", () => {
  hillTrail = [];
  hillDone = false;
  $("hillX").textContent = "—";
  $("hillValue").textContent = "—";
  $("hillIterations").textContent = "—";
  $("hillStatus").textContent = "Run the optimizer to find a local maximum.";
  drawHill();
});


/* INITIALIZE */

renderGame();
renderMaze();
drawHill();
