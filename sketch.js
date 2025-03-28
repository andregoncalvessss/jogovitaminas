// -------------- VARIÁVEIS GLOBAIS --------------
let video, handpose, predictions = [];
let foodPool, score = 0, lives = 3, healthyCaughtCount = 0;
let bestScore = 0; 
let gameStarted = false, gameOver = false;
let gamePaused = false;

// Flags para instruções
let showInstructions = false;
let showPauseInstructions = false;

let startButton, replayButton, instructionsButton, closeInstructionsButton;
let pauseButton;
let resumeButton, recomeçarButton, terminarButton;
let instructionsPauseButton, closeInstructionsPauseButton;

let backgroundImg;
let healthyImgs = [], unhealthyImgs = [];

let handposeLoaded = false;

// Constantes de jogo
const MAX_LIVES = 3;
const CATCH_RADIUS = 40;
const FOOD_SIZE = 50;
const HEALTHY_SCORE = 10;
const UNHEALTHY_PENALTY = 5;
const HEALTHY_FOR_EXTRA_LIFE = 5;

const INSTRUCTIONS_TEXT =
  "• Mover a mão (fechada ou aberta) para apanhar alimentos saudáveis\n" +
  "• Evite apanhar alimentos que não são saudáveis\n" +
  "• Se perder alguma vida, tente apanhar 5 alimentos saudáveis seguidos para recuperar a vida\n" +
  "• Quando acabar as 3 vidas o jogo termina\n" +
  "• Objetivo: Tenta obter a maior pontuação possível";

// -------------- FUNÇÃO AUXILIAR: ESTRELAS POR PONTUAÇÃO --------------
function getStarStringFromScore(score) {
  // Se a pontuação for 0 ou menor, não retorna nenhuma estrela
  if (score <= 0) {
    return "";
  }
  let starCount;
  if (score <= 40) {
    starCount = 1;
  } else if (score <= 80) {
    starCount = 2;
  } else {
    starCount = 3;
  }
  return ("★ ").repeat(starCount).trim();
}

// -------------- PRELOAD --------------
function preload() {
  backgroundImg = loadImage("background_jogo.jpg");

  for (let i = 1; i <= 12; i++) {
    let img = loadImage(`photos/${i}.png`);
    (i <= 6 ? healthyImgs : unhealthyImgs).push(img);
  }
}

// -------------- SETUP --------------
function setup() {
  createCanvas(640, 480);

  if (!video) {
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();
  }

  if (!handposeLoaded) {
    handpose = ml5.handpose(video, () => {
      console.log("Modelo carregado!");
      handposeLoaded = true;
    });
    handpose.on("predict", results => predictions = results);
  }

  foodPool = new FoodPool();

  // Botões (Tela Inicial)
  startButton = createButton("JOGAR");
  estilizarBotaoStart(startButton);
  startButton.mousePressed(startGame);

  instructionsButton = createButton("INSTRUÇÕES");
  estilizarBotaoInstructions(instructionsButton);
  instructionsButton.mousePressed(openInstructions);

  replayButton = createButton("JOGAR NOVAMENTE");
  estilizarBotaoReplay(replayButton);
  replayButton.mousePressed(restartGame);
  replayButton.hide();

  closeInstructionsButton = createButton("X");
  estilizarBotaoFechar(closeInstructionsButton);
  closeInstructionsButton.mousePressed(closeInstructions);
  closeInstructionsButton.hide();

  // Botão de Pausa (símbolo “⏸”)
  pauseButton = createButton("⏸");
  estilizarBotaoPause(pauseButton);
  pauseButton.size(24, 24);  // Botão pequeno
  pauseButton.mousePressed(pauseGame);
  pauseButton.hide();         // Escondido no início

  // Botões do Menu de Pausa
  resumeButton = createButton("RETOMAR");
  estilizarBotaoResume(resumeButton);
  resumeButton.mousePressed(resumeGame);
  resumeButton.hide();

  recomeçarButton = createButton("RECOMEÇAR");
  estilizarBotaoOrange(recomeçarButton);
  recomeçarButton.mousePressed(recomeçarPartida);
  recomeçarButton.hide();

  terminarButton = createButton("TERMINAR");
  estilizarBotaoRed(terminarButton);
  terminarButton.mousePressed(terminarPartida);
  terminarButton.hide();

  instructionsPauseButton = createButton("INSTRUÇÕES");
  estilizarBotaoInstructions(instructionsPauseButton);
  instructionsPauseButton.mousePressed(openInstructionsFromPause);
  instructionsPauseButton.hide();

  closeInstructionsPauseButton = createButton("X");
  estilizarBotaoFechar(closeInstructionsPauseButton);
  closeInstructionsPauseButton.mousePressed(closeInstructionsFromPause);
  closeInstructionsPauseButton.hide();

  // Posiciona os botões iniciais
  positionStartScreenButtons();
}

// -------------- POSICIONAMENTO DOS BOTÕES INICIAIS --------------
function positionStartScreenButtons() {
  const startBtnWidth = 220;
  const instructionsBtnWidth = 160;
  const startX = width / 2 - startBtnWidth / 2;
  const instX = width / 2 - instructionsBtnWidth / 2;

  const startY = height / 2 + 20;
  const instY = startY + 70;

  startButton.size(startBtnWidth, 50);
  startButton.position(startX, startY);

  instructionsButton.size(instructionsBtnWidth, 50);
  instructionsButton.position(instX, instY);
}

// -------------- DRAW --------------
function draw() {
  if (!gameStarted) {
    drawStartScreen();
    return;
  }
  if (gameOver) {
    drawGameOver();
    return;
  }

  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (gamePaused) {
    if (showPauseInstructions) drawInstructionsPause();
    else drawPauseOverlay();
    return;
  }

  playGame();
}

// -------------- TELA INICIAL --------------
function drawStartScreen() {
  image(backgroundImg, 0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(255);
  noStroke();
  textSize(48);
  text("CAÇA VITAMINAS", width / 2, height / 4);

  if (!showInstructions) {
    startButton.show();
    instructionsButton.show();
    replayButton.hide();
  }
  if (showInstructions) {
    drawInstructionsOverlay();
  }
}

// -------------- TELA DE FIM DE JOGO --------------
function drawGameOver() {
  image(backgroundImg, 0, 0, width, height);

  if (score > bestScore) bestScore = score;

  let starString = getStarStringFromScore(score);

  textAlign(CENTER, CENTER);
  textSize(64);
  fill(255, 215, 0);
  text(starString, width / 2, height / 2 - 140);

  fill(255);
  noStroke();
  textSize(36);
  text("Fim de Jogo!", width / 2, height / 2 - 60);

  textSize(24);
  text(`Pontuação: ${score}`, width / 2, height / 2 - 20);
  text(`Melhor Pontuação: ${bestScore}`, width / 2, height / 2 + 20);

  startButton.hide();
  instructionsButton.hide();
  pauseButton.hide();
  hidePauseButtons();
  hidePauseInstructionsButtons();

  replayButton.show();
  const replayW = 220;
  replayButton.size(replayW, 50);
  replayButton.position(width / 2 - replayW / 2, height / 2 + 80);
}

// -------------- MENU DE INSTRUÇÕES (INICIAL) --------------
function drawInstructionsOverlay() {
  push();
  noStroke();
  fill(0, 150);
  rect(0, 0, width, height);
  pop();

  const boxW = width * 0.8;
  const boxH = height * 0.6;
  const boxX = (width - boxW) / 2;
  const boxY = (height - boxH) / 2;

  fill(255);
  rect(boxX, boxY, boxW, boxH, 20);

  fill(0);
  textSize(28);
  textAlign(CENTER, CENTER);
  text("INSTRUÇÕES", width / 2, boxY + 40);

  textSize(16);
  textAlign(LEFT, TOP);
  const margin = 40;
  text(
    INSTRUCTIONS_TEXT,
    boxX + margin,
    boxY + 80,
    boxW - margin * 2,
    boxH - 120
  );

  closeInstructionsButton.show();
  closeInstructionsButton.position(boxX + boxW - 45, boxY + 10);
}

// -------------- MENU DE PAUSA --------------
function drawPauseOverlay() {
  push();
  fill(0, 150);
  noStroke();
  rect(0, 0, width, height);
  pop();

  textAlign(CENTER, CENTER);
  textSize(40);
  fill(255);
  text("JOGO EM PAUSA", width / 2, height / 2 - 100);

  resumeButton.show();
  resumeButton.size(220, 50);
  resumeButton.position(width / 2 - 110, height / 2 - 20);

  recomeçarButton.show();
  recomeçarButton.size(220, 50);
  recomeçarButton.position(width / 2 - 110, height / 2 + 40);

  terminarButton.show();
  terminarButton.size(220, 50);
  terminarButton.position(width / 2 - 110, height / 2 + 100);

  instructionsPauseButton.show();
  instructionsPauseButton.size(220, 50);
  instructionsPauseButton.position(width / 2 - 110, height / 2 + 160);
}

// -------------- INSTRUÇÕES NO PAUSA --------------
function openInstructionsFromPause() {
  hidePauseButtons();
  instructionsPauseButton.hide();
  showPauseInstructions = true;
}
function drawInstructionsPause() {
  push();
  fill(0, 150);
  noStroke();
  rect(0, 0, width, height);
  pop();

  const boxW = width * 0.8;
  const boxH = height * 0.6;
  const boxX = (width - boxW) / 2;
  const boxY = (height - boxH) / 2;

  fill(255);
  rect(boxX, boxY, boxW, boxH, 20);

  fill(0);
  textSize(28);
  textAlign(CENTER, CENTER);
  text("INSTRUÇÕES (PAUSA)", width / 2, boxY + 40);

  textSize(16);
  textAlign(LEFT, TOP);
  const margin = 40;
  text(
    INSTRUCTIONS_TEXT,
    boxX + margin,
    boxY + 80,
    boxW - margin * 2,
    boxH - 120
  );

  closeInstructionsPauseButton.show();
  closeInstructionsPauseButton.position(boxX + boxW - 45, boxY + 10);
}
function closeInstructionsFromPause() {
  closeInstructionsPauseButton.hide();
  showPauseInstructions = false;
  drawPauseOverlay();
}

// -------------- ESCONDER BOTÕES DE PAUSA --------------
function hidePauseButtons() {
  resumeButton.hide();
  recomeçarButton.hide();
  terminarButton.hide();
  instructionsPauseButton.hide();
}
function hidePauseInstructionsButtons() {
  instructionsPauseButton.hide();
  closeInstructionsPauseButton.hide();
}

// -------------- ABRIR / FECHAR INSTRUÇÕES (INICIAL) --------------
function openInstructions() {
  showInstructions = true;
  startButton.hide();
  instructionsButton.hide();
}
function closeInstructions() {
  showInstructions = false;
  closeInstructionsButton.hide();
  startButton.show();
  instructionsButton.show();
}

// -------------- PAUSAR / RETOMAR / RECOMEÇAR / TERMINAR --------------
function pauseGame() {
  gamePaused = true;
  pauseButton.hide();
}
function resumeGame() {
  gamePaused = false;
  hidePauseButtons();
  hidePauseInstructionsButtons();
  pauseButton.show();
}
function recomeçarPartida() {
  resetGameState();
  hidePauseButtons();
  hidePauseInstructionsButtons();
  pauseButton.show();
}
function terminarPartida() {
  gameOver = true;
  gamePaused = false;
}

// -------------- INICIAR / REINICIAR JOGO --------------
function startGame() {
  resetGameState();
  pauseButton.show(); // Mostra o botão de pausa ao iniciar
  startButton.hide();
  instructionsButton.hide();
  gameStarted = true;
}
function restartGame() {
  resetGameState();
  replayButton.hide();
  startButton.hide();
  instructionsButton.hide();
  pauseButton.show(); // Mostra o botão de pausa no reinício
  gameStarted = true;
}

// -------------- RESET GERAL --------------
function resetGameState() {
  gameOver = false;
  gamePaused = false;
  score = 0;
  lives = MAX_LIVES;
  healthyCaughtCount = 0;
  showInstructions = false;
  showPauseInstructions = false;
  closeInstructionsButton.hide();
  closeInstructionsPauseButton.hide();
  foodPool.reset();
  hidePauseButtons();
  hidePauseInstructionsButtons();
}

// -------------- LOOP PRINCIPAL DO JOGO --------------
function playGame() {
  spawnFood();
  let dtFactor = deltaTime / 16.67;
  let handCenter = getHandCenter();

  if (handCenter) {
    fill(255, 255, 255, 80);
    noStroke();
    ellipse(handCenter.x, handCenter.y, 80);
  }

  for (let i = foodPool.foods.length - 1; i >= 0; i--) {
    let food = foodPool.foods[i];
    if (!food.inUse) continue;

    food.move(dtFactor);
    food.show();

    if (handCenter && food.checkCollision(handCenter.x, handCenter.y, CATCH_RADIUS)) {
      handleCatch(food);
    } else if (food.offScreen()) {
      foodPool.releaseFood(food);
    }
  }

  drawTopBar();
}

// -------------- DESENHAR BARRA SUPERIOR --------------
function drawTopBar() {
  let topBarY = 20;

  textSize(18);
  textAlign(LEFT, CENTER);
  fill(255);

  let scoreText = `Pontuação: ${score}`;
  let scoreWidth = textWidth(scoreText);
  text(scoreText, 10, topBarY);

  let desiredX = 10 + scoreWidth + 15;
  let desiredY = topBarY - 5;
  pauseButton.position(desiredX, desiredY);

  textAlign(RIGHT, CENTER);
  text("❤️".repeat(lives), width - 10, topBarY);
}

// -------------- PEGAR ALIMENTO --------------
function handleCatch(food) {
  if (food.healthy) {
    score += HEALTHY_SCORE;
    healthyCaughtCount++;
    if (healthyCaughtCount >= HEALTHY_FOR_EXTRA_LIFE && lives < MAX_LIVES) {
      lives++;
      healthyCaughtCount = 0;
    }
  } else {
    score -= UNHEALTHY_PENALTY;
    // Garante que a pontuação não seja negativa
    if (score < 0) {
      score = 0;
    }
    if (--lives <= 0) {
      gameOver = true;
    }
  }
  foodPool.releaseFood(food);
}

// -------------- DETECÇÃO DE MÃO --------------
function getHandCenter() {
  if (predictions.length === 0 || gameOver || gamePaused) return null;
  let landmarks = predictions[0].landmarks;
  let sum = landmarks.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]);
  return {
    x: width - (sum[0] / landmarks.length),
    y: sum[1] / landmarks.length
  };
}

// -------------- ALIMENTOS --------------
function spawnFood() {
  if (frameCount % 60 === 0 && !gameOver && !gamePaused) {
    let isHealthy = random() < 0.6;
    let img = random(isHealthy ? healthyImgs : unhealthyImgs);
    foodPool.getFood(img, isHealthy);
  }
}

class Food {
  constructor(img, healthy) {
    this.reset(img, healthy);
  }
  reset(img, healthy) {
    this.img = img;
    this.healthy = healthy;
    this.x = random(50, width - 50);
    this.y = -20;
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.05, 0.05);
    this.size = FOOD_SIZE;
    this.inUse = true;
  }
  move(dt) {
    let speed = getCurrentSpeed();
    this.y += speed * dt;
    this.angle += this.rotationSpeed * (speed / 3) * dt;
  }
  show() {
    if (!this.inUse) return;
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    imageMode(CENTER);
    image(this.img, 0, 0, this.size, this.size);
    pop();
  }
  checkCollision(px, py, radius = 10) {
    return this.inUse && dist(this.x, this.y, px, py) < (this.size / 2 + radius);
  }
  offScreen() {
    return this.y > height + 20;
  }
}

class FoodPool {
  constructor() {
    this.foods = [];
  }
  getFood(img, healthy) {
    let food = this.foods.find(f => !f.inUse);
    if (!food) {
      food = new Food(img, healthy);
      this.foods.push(food);
    } else {
      food.reset(img, healthy);
    }
    return food;
  }
  releaseFood(food) {
    food.inUse = false;
  }
  reset() {
    for (let f of this.foods) {
      f.inUse = false;
    }
  }
}

function getCurrentSpeed() {
  return 3 + max(score, 0) / 50;
}

// -------------- ESTILOS DE BOTÕES --------------

// START
function estilizarBotaoStart(btn) {
  btn.style('background', 'linear-gradient(135deg, #4CAF50, #2E7D32)');
  btn.style('border', 'none');
  btn.style('color', 'white');
  btn.style('font-size', '20px');
  btn.style('font-weight', 'bold');
  btn.style('font-family', 'sans-serif');
  btn.style('padding', '15px 40px');
  btn.style('border-radius', '8px');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '0 4px 8px rgba(0,0,0,0.2)');
  btn.style('transition', 'transform 0.2s ease');
  btn.mouseOver(() => btn.style('transform', 'scale(1.08)'));
  btn.mouseOut(() => btn.style('transform', 'scale(1)'));
}

// REPLAY
function estilizarBotaoReplay(btn) {
  btn.style('background', 'linear-gradient(135deg, #388E3C, #1E7D32)');
  btn.style('border', 'none');
  btn.style('color', 'white');
  btn.style('font-size', '20px');
  btn.style('font-weight', 'bold');
  btn.style('font-family', 'sans-serif');
  btn.style('width', '220px');
  btn.style('height', '50px');
  btn.style('text-align', 'center');
  btn.style('line-height', '50px');
  btn.style('white-space', 'nowrap');
  btn.style('border-radius', '8px');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '0 4px 8px rgba(0,0,0,0.2)');
  btn.style('transition', 'transform 0.2s ease');
  btn.mouseOver(() => btn.style('transform', 'scale(1.08)'));
  btn.mouseOut(() => btn.style('transform', 'scale(1)'));
}

// INSTRUÇÕES
function estilizarBotaoInstructions(btn) {
  btn.style('background', 'linear-gradient(135deg, #2196F3, #0D47A1)');
  btn.style('border', 'none');
  btn.style('color', 'white');
  btn.style('font-size', '18px');
  btn.style('font-weight', 'bold');
  btn.style('font-family', 'sans-serif');
  btn.style('text-align', 'center');
  btn.style('line-height', '50px');
  btn.style('border-radius', '8px');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '0 4px 8px rgba(0,0,0,0.2)');
  btn.style('transition', 'transform 0.2s ease');
  btn.mouseOver(() => btn.style('transform', 'scale(1.08)'));
  btn.mouseOut(() => btn.style('transform', 'scale(1)'));
}

// PAUSA (botão menor com símbolo)
function estilizarBotaoPause(btn) {
  btn.style('background', 'linear-gradient(135deg, #FF9800, #F57C00)');
  btn.style('border', 'none');
  btn.style('color', 'white');
  btn.style('font-size', '12px'); // Fonte menor
  btn.style('font-weight', 'bold');
  btn.style('font-family', 'sans-serif');
  btn.style('padding', '0px');  // Sem padding
  btn.style('border-radius', '6px');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '0 2px 4px rgba(0,0,0,0.2)');
  btn.style('transition', 'transform 0.2s ease');
  btn.mouseOver(() => btn.style('transform', 'scale(1.08)'));
  btn.mouseOut(() => btn.style('transform', 'scale(1)'));
}

// RETOMAR (verde)
function estilizarBotaoResume(btn) {
  btn.style('background', 'linear-gradient(135deg, #2E7D32, #1E7D32)');
  btn.style('border', 'none');
  btn.style('color', 'white');
  btn.style('font-size', '20px');
  btn.style('font-weight', 'bold');
  btn.style('font-family', 'sans-serif');
  btn.style('padding', '15px 40px');
  btn.style('border-radius', '8px');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '0 4px 8px rgba(0,0,0,0.2)');
  btn.style('transition', 'transform 0.2s ease');
  btn.mouseOver(() => btn.style('transform', 'scale(1.08)'));
  btn.mouseOut(() => btn.style('transform', 'scale(1)'));
}

// RECOMEÇAR (laranja)
function estilizarBotaoOrange(btn) {
  btn.style('background', 'linear-gradient(135deg, #FFA726, #FB8C00)');
  btn.style('border', 'none');
  btn.style('color', 'white');
  btn.style('font-size', '20px');
  btn.style('font-weight', 'bold');
  btn.style('font-family', 'sans-serif');
  btn.style('padding', '15px 40px');
  btn.style('border-radius', '8px');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '0 4px 8px rgba(0,0,0,0.2)');
  btn.style('transition', 'transform 0.2s ease');
  btn.mouseOver(() => btn.style('transform', 'scale(1.08)'));
  btn.mouseOut(() => btn.style('transform', 'scale(1)'));
}

// TERMINAR (vermelho)
function estilizarBotaoRed(btn) {
  btn.style('background', 'linear-gradient(135deg, #f44336, #d32f2f)');
  btn.style('border', 'none');
  btn.style('color', 'white');
  btn.style('font-size', '20px');
  btn.style('font-weight', 'bold');
  btn.style('font-family', 'sans-serif');
  btn.style('padding', '15px 40px');
  btn.style('border-radius', '8px');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '0 4px 8px rgba(0,0,0,0.2)');
  btn.style('transition', 'transform 0.2s ease');
  btn.mouseOver(() => btn.style('transform', 'scale(1.08)'));
  btn.mouseOut(() => btn.style('transform', 'scale(1)'));
}

// FECHAR (X)
function estilizarBotaoFechar(btn) {
  btn.style('background-color', '#4CAF50');
  btn.style('color', 'white');
  btn.style('border', 'none');
  btn.style('font-size', '20px');
  btn.style('width', '30px');
  btn.style('height', '30px');
  btn.style('border-radius', '50%');
  btn.style('cursor', 'pointer');
  btn.style('text-align', 'center');
  btn.style('padding', '0px');
  btn.style('font-family', 'sans-serif');
  btn.style('transition', 'transform 0.2s ease');
  btn.mouseOver(() => btn.style('transform', 'scale(1.1)'));
  btn.mouseOut(() => btn.style('transform', 'scale(1)'));
}
