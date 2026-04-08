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
  dom: { createContainer: true }, // تفعيل الـ DOM لاستخدام الـ CSS
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);

function preload() {
  this.load.audio('tap', 'https://actions.google.com/sounds/v1/cartoon/pop.ogg');
  // تأكد من وضع صورة اللوغو التي صممناها في هذا المسار
  this.load.image('logo', 'assets/logo.png'); 
}

function create() {
  let scene = this;

  if (!gameStarted) {
    // خلفية شاشة البداية (تطابق ألوان الصورة)
    let bgStart = scene.add.graphics();
    bgStart.fillGradientStyle(0x0a0f1a, 0x0a0f1a, 0x1a2a6c, 0x1a2a6c, 1);
    bgStart.fillRect(0, 0, config.width, config.height);

    // إضافة اللوغو (إذا كان متوفراً)
    if (scene.textures.exists('logo')) {
        scene.add.image(config.width/2, config.height/3, 'logo').setScale(0.5);
    } else {
        scene.add.text(config.width/2, config.height/3, 'TAP RUSH', {
            fontSize: '64px',
            fontFamily: 'Arial Black',
            color: '#00f2ff'
        }).setOrigin(0.5).setStroke('#0055ff', 8);
    }

    // زر البداية بتصميم عصري
    startBtn = scene.add.dom(config.width/2, config.height * 0.7, 'button', 
        'padding: 15px 40px; font-size: 30px; background: linear-gradient(to bottom, #00f2ff, #0055ff); border: none; border-radius: 50px; color: white; cursor: pointer; box-shadow: 0 0 20px #00f2ff;', 
        'TAP TO START');
    
    startBtn.addListener('click');
    startBtn.on('click', () => {
      gameStarted = true;
      scene.scene.restart();
    });
    return;
  }

  // خلفية اللعب (Dark Cyber Grid)
  let bg = scene.add.graphics();
  bg.fillStyle(0x0a0f1a, 1);
  bg.fillRect(0, 0, config.width, config.height);
  
  // رسم شبكة خفيفة (Grid) مثل الصورة
  bg.lineStyle(1, 0x00f2ff, 0.1);
  for(let i=0; i<config.width; i+=40) bg.lineBetween(i, 0, i, config.height);
  for(let i=0; i<config.height; i+=40) bg.lineBetween(0, i, config.width, i);

  score = 0;
  timeLeft = 15;
  combo = 0;
  gameOver = false;

  // UI Text (تنسيق يشبه الصورة)
  const textStyle = { fontFamily: 'Arial', fontWeight: 'bold' };
  scoreText = scene.add.text(config.width/2, 50, 'Score: 0', { ...textStyle, fontSize: '32px', color: '#00f2ff' }).setOrigin(0.5);
  timerText = scene.add.text(config.width/2, 100, 'Time: 15', { ...textStyle, fontSize: '28px', color: '#ffcc00' }).setOrigin(0.5);
  highScoreText = scene.add.text(config.width/2, 140, 'Best: ' + highScore, { ...textStyle, fontSize: '22px', color: '#00ff88' }).setOrigin(0.5);

  // حل مشكلة الظل: نستخدم Graphics لرسم دائرة مع "توهج" (Glow)
  circle = scene.add.circle(config.width/2, config.height/2, 80, 0x00f2ff).setInteractive();
  
  // إضافة تأثير التوهج الخارجي يدوياً
  let glow = scene.add.circle(config.width/2, config.height/2, 85, 0x00f2ff, 0.3);

  // Pulse animation للـ Circle والـ Glow
  scene.tweens.add({
    targets: [circle, glow],
    scale: 1.1,
    duration: 800,
    yoyo: true,
    repeat: -1
  });

  // Particles (تعديل الألوان لتناسب النيون)
  particles = scene.add.particles(0, 0, null, {
    speed: { min: -200, max: 200 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 500,
    blendMode: 'ADD',
    tint: 0x00f2ff
  });

  tapSound = scene.sound.add('tap');

  circle.on('pointerdown', () => {
    if (!gameOver) {
      score++;
      combo++;
      timeLeft += 0.4;

      scoreText.setText('Score: ' + score);
      
      // تغيير اللون عند الضغط
      circle.setFillStyle(0xffffff);
      scene.time.delayedCall(50, () => circle.setFillStyle(0x00f2ff));

      particles.emitParticleAt(circle.x, circle.y);
      tapSound.play();
      if (navigator.vibrate) navigator.vibrate(30);

      scene.tweens.add({
        targets: circle,
        scale: 1.3,
        duration: 100,
        yoyo: true
      });
    }
  });

  // Timer
  scene.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      if (!gameOver) {
        timeLeft--;
        timerText.setText('Time: ' + Math.max(0, Math.floor(timeLeft)));
        if (timeLeft <= 0) endGame(scene);
      }
    }
  });
}

function endGame(scene) {
  gameOver = true;
  circle.destroy();

  scene.add.text(config.width/2, config.height/2 - 100, "GAME OVER", {
    fontSize: '60px', color: '#ff0055', fontWeight: 'bold'
  }).setOrigin(0.5);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", score);
  }

  let restart = scene.add.dom(config.width/2, config.height/2 + 50, 'button', 
    'padding: 10px 30px; font-size: 25px; background: #00ff88; border-radius: 10px;', 
    'PLAY AGAIN');
  
  restart.addListener('click');
  restart.on('click', () => scene.scene.restart());
}

function update() {}
