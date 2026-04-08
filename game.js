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
  width: 400,
  height: 600,
  scene: { preload, create, update }
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
    scene.add.rectangle(200, 300, 400, 600, 0x123456);
    // scene.add.image(200, 250, 'logo').setScale(0.5);
    startBtn = scene.add.text(150, 450, 'START', { fontSize: '32px', color: '#00ffff', backgroundColor: '#000' })
      .setPadding(10)
      .setInteractive();

    startBtn.on('pointerdown', () => {
      gameStarted = true;
      scene.scene.restart();
    });
    return;
  }

  // 🌈 Gameplay Background
  let bg = scene.add.graphics();
  bg.fillGradientStyle(0x1a2a6c, 0xb21f1f, 0xfdbb2d, 0x000000, 1);
  bg.fillRect(0, 0, 400, 600);

  score = 0;
  timeLeft = 15;
  combo = 0;
  gameOver = false;

  // 🧾 UI
  scoreText = scene.add.text(130, 20, 'Score: 0', { fontSize: '26px', color: '#fff' });
  timerText = scene.add.text(130, 60, 'Time: 15', { fontSize: '24px', color: '#0ff' });
  comboText = scene.add.text(140, 100, 'Combo: 0', { fontSize: '22px', color: '#ff0' });
  highScoreText = scene.add.text(110, 140, 'Best: ' + highScore, { fontSize: '20px', color: '#0f0' });

  // 🎯 Circle
  circle = scene.add.circle(200, 350, 80, 0x00ffcc).setInteractive();

  // Pulse animation
  scene.tweens.add({
    targets: circle,
    scale: 1.1,
    duration: 700,
    yoyo: true,
    repeat: -1
  });

  // 💥 Particles
  particles = scene.add.particles(0, 0, null, {
    speed: { min: -150, max: 150 },
    scale: { start: 0.6, end: 0 },
    lifespan: 400,
    quantity: 8
  });

  // 🔊 Sound
  tapSound = scene.sound.add('tap');

  // Tap Event
  circle.on('pointerdown', () => {
    if (!gameOver) {
      score++;
      combo++;
      timeLeft += 0.4;

      scoreText.setText('Score: ' + score);
      comboText.setText('Combo: ' + combo);

      // 🎨 Random Color
      circle.setFillStyle(Phaser.Display.Color.RandomRGB().color);

      // 💥 particles
      particles.emitParticleAt(circle.x, circle.y);

      // 🔊 play sound
      tapSound.play();

      // 📳 vibration
      if (navigator.vibrate) navigator.vibrate(30);

      // Bounce effect
      scene.tweens.add({
        targets: circle,
        scale: 1.25,
        duration: 80,
        yoyo: true
      });

      // Bonus Combo
      if (combo % 10 === 0) {
        timeLeft += 2;
        showText(scene, "🔥 BONUS +2s");
      }
    }
  });

  // ⏱ Timer
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

  showText(scene, "GAME OVER", 200);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", score);
    showText(scene, "🏆 NEW RECORD!", 250);
  }

  showText(scene, "Score: " + score, 300);

  // 🔁 Restart
  let restart = scene.add.text(130, 360, 'PLAY AGAIN', {
    fontSize: '26px',
    color: '#00ffff',
    backgroundColor: '#000'
  }).setPadding(10).setInteractive();

  restart.on('pointerdown', () => {
    scene.scene.restart();
  });

  // 🏆 Facebook Leaderboard
  if (typeof FBInstant !== "undefined") {
    FBInstant.getLeaderboardAsync('highscores')
      .then(lb => lb.setScoreAsync(score));
  }
}

// ✨ Floating Text
function showText(scene, msg, y = 220) {
  let txt = scene.add.text(100, y, msg, {
    fontSize: '24px',
    color: '#fff'
  });

  scene.tweens.add({
    targets: txt,
    y: y - 50,
    alpha: 0,
    duration: 800,
    onComplete: () => txt.destroy()
  });
}