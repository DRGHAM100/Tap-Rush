let score = 0;
let timeLeft = 15;
let gameOver = false;
let highScore = localStorage.getItem("highScore") || 0;
let combo = 0;
let gameStarted = false;

let scoreText, timerText, comboText, highScoreText;
let circle, particles, tapSound;
let startBtn;

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  scene: { preload, create, update },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);

function preload() {
  this.load.audio('tap', 'https://actions.google.com/sounds/v1/cartoon/pop.ogg');
  this.load.image('logo', 'assets/logo.png'); // Intro Logo
}

function create() {
  let scene = this;

  // Facebook Init
  if (typeof FBInstant !== "undefined") {
    FBInstant.initializeAsync().then(() => {
      return FBInstant.startGameAsync();
    });
  }

  if (!gameStarted) {
    // Intro Screen
    scene.add.rectangle(config.width/2, config.height/2, config.width, config.height, 0x123456);
    startBtn = scene.add.dom(config.width/2, config.height-150, 'div', 'class=button-text', 'START');
    startBtn.addListener('click');
    startBtn.on('click', () => {
      gameStarted = true;
      scene.scene.restart();
    });
    return;
  }

  // Gameplay Background Gradient
  let bg = scene.add.graphics();
  bg.fillGradientStyle(0x1a2a6c, 0xb21f1f, 0xfdbb2d, 0x000000, 1);
  bg.fillRect(0, 0, config.width, config.height);

  score = 0;
  timeLeft = 15;
  combo = 0;
  gameOver = false;

  // UI Text
  scoreText = scene.add.text(20, 20, 'Score: 0', { fontSize: '26px', color: '#fff' });
  timerText = scene.add.text(20, 60, 'Time: 15', { fontSize: '24px', color: '#0ff' });
  comboText = scene.add.text(20, 100, 'Combo: 0', { fontSize: '22px', color: '#ff0' });
  highScoreText = scene.add.text(20, 140, 'Best: ' + highScore, { fontSize: '20px', color: '#0f0' });

  // Circle
  circle = scene.add.circle(config.width/2, config.height/2, 80, 0x00ffcc).setInteractive();

  // Pulse animation
  scene.tweens.add({
    targets: circle,
    scale: 1.1,
    duration: 700,
    yoyo: true,
    repeat: -1
  });

  // Particles
  particles = scene.add.particles(0, 0, null, {
    speed: { min: -150, max: 150 },
    scale: { start: 0.6, end: 0 },
    lifespan: 400,
    quantity: 8
  });

  // Sound
  tapSound = scene.sound.add('tap');

  // Tap Event
  circle.on('pointerdown', () => {
    if (!gameOver) {
      score++;
      combo++;
      timeLeft += 0.4;

      scoreText.setText('Score: ' + score);
      comboText.setText('Combo: ' + combo);

      circle.setFillStyle(Phaser.Display.Color.RandomRGB().color);
      particles.emitParticleAt(circle.x, circle.y);
      tapSound.play();
      if (navigator.vibrate) navigator.vibrate(30);

      scene.tweens.add({
        targets: circle,
        scale: 1.25,
        duration: 80,
        yoyo: true
      });

      if (combo % 10 === 0) {
        timeLeft += 2;
        showText(scene, "🔥 BONUS +2s");
      }
    }
  });

  // Timer
  scene.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      if (!gameOver) {
        timeLeft--;
        combo = 0;
        comboText.setText('Combo: 0');
        timerText.setText('Time: ' + Math.floor(timeLeft));

        if (timeLeft <= 0) {
          endGame(scene);
        }
      }
    }
  });
}

function update() {}

function endGame(scene) {
  gameOver = true;

  showText(scene, "GAME OVER", scene.cameras.main.centerY - 50);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", score);
    showText(scene, "🏆 NEW RECORD!", scene.cameras.main.centerY);
  }

  showText(scene, "Score: " + score, scene.cameras.main.centerY + 50);

  // Restart
  let restart = scene.add.dom(config.width/2, scene.cameras.main.centerY + 150, 'div', 'class=button-text', 'PLAY AGAIN');
  restart.addListener('click');
  restart.on('click', () => {
    scene.scene.restart();
  });
}

function showText(scene, msg, y) {
  let txt = scene.add.dom(config.width/2, y, 'div', 'class=floating-text', msg);
  scene.tweens.add({
    targets: txt,
    y: y - 50,
    alpha: 0,
    duration: 800,
    onComplete: () => txt.destroy()
  });
}