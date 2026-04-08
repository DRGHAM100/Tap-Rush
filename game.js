let score = 0;
let timeLeft = 15;
let gameOver = false;
let highScore = localStorage.getItem("highScore") || 0;
let gameStarted = false;

let scoreText, timerText, highScoreText;
let circle, glow, particles, tapSound;
let startBtn;

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    dom: { createContainer: true },
    // إعدادات الشاشة الكاملة للموبايل
    scale: {
        mode: Phaser.Scale.ENVELOP, // يملأ الشاشة بالكامل
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight
    },
    scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() {
    this.load.audio('tap', 'https://actions.google.com/sounds/v1/cartoon/pop.ogg');
}

function create() {
    let scene = this;
    const screenWidth = scene.sys.game.config.width;
    const screenHeight = scene.sys.game.config.height;

    if (!gameStarted) {
        let bgStart = scene.add.graphics();
        bgStart.fillGradientStyle(0x0a0f1a, 0x0a0f1a, 0x1a2a6c, 0x1a2a6c, 1);
        bgStart.fillRect(0, 0, screenWidth, screenHeight);

        scene.add.text(screenWidth/2, screenHeight/3, 'TAP RUSH', {
            fontSize: '12vw', // حجم خط متجاوب
            fontFamily: 'Arial Black',
            color: '#00f2ff'
        }).setOrigin(0.5).setStroke('#0055ff', 8);

        startBtn = scene.add.dom(screenWidth/2, screenHeight * 0.7, 'button', 
            'padding: 15px 40px; font-size: 24px; background: linear-gradient(to bottom, #00f2ff, #0055ff); border: none; border-radius: 50px; color: white; cursor: pointer; box-shadow: 0 0 20px #00f2ff; font-weight: bold; width: 200px;', 
            'START');
        
        startBtn.addListener('click');
        startBtn.on('click', () => {
            gameStarted = true;
            scene.scene.restart();
        });
        return;
    }

    // خلفية اللعب
    let bg = scene.add.graphics();
    bg.fillStyle(0x0a0f1a, 1);
    bg.fillRect(0, 0, screenWidth, screenHeight);
    
    bg.lineStyle(1, 0x00f2ff, 0.1);
    for(let i=0; i<screenWidth; i+=40) bg.lineBetween(i, 0, i, screenHeight);
    for(let i=0; i<screenHeight; i+=40) bg.lineBetween(0, i, screenWidth, i);

    score = 0;
    timeLeft = 15;
    gameOver = false;

    // نصوص الواجهة - أحجام متناسبة مع الموبايل
    const textStyle = { fontFamily: 'Arial Black', fontWeight: 'bold' };
    scoreText = scene.add.text(screenWidth/2, 50, 'SCORE: 0', { ...textStyle, fontSize: '32px', color: '#00f2ff' }).setOrigin(0.5);
    timerText = scene.add.text(screenWidth/2, 95, 'TIME: 15', { ...textStyle, fontSize: '24px', color: '#ffcc00' }).setOrigin(0.5);
    highScoreText = scene.add.text(screenWidth/2, 130, 'BEST: ' + highScore, { ...textStyle, fontSize: '18px', color: '#00ff88' }).setOrigin(0.5);

    // --- تصغير حجم الدائرة (نصف القطر 40 بدل 75) ---
    glow = scene.add.circle(screenWidth/2, screenHeight/2, 45, 0x00f2ff, 0.2);
    circle = scene.add.circle(screenWidth/2, screenHeight/2, 40, 0x00f2ff).setInteractive();

    scene.tweens.add({
        targets: [circle, glow],
        scale: 1.15,
        duration: 600,
        yoyo: true,
        repeat: -1
    });

    particles = scene.add.particles(0, 0, null, {
        speed: { min: -150, max: 150 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        blendMode: 'ADD',
        tint: 0x00f2ff
    });

    tapSound = scene.sound.add('tap');

    circle.on('pointerdown', () => {
        if (!gameOver) {
            score++;
            scoreText.setText('SCORE: ' + score);

            // مكان عشوائي جديد مع ضمان البقاء داخل حدود شاشة الموبايل
            let newX = Phaser.Math.Between(50, screenWidth - 50);
            let newY = Phaser.Math.Between(180, screenHeight - 80);

            circle.setPosition(newX, newY);
            glow.setPosition(newX, newY);

            particles.emitParticleAt(newX, newY);
            tapSound.play();
            
            if (navigator.vibrate) navigator.vibrate(25);

            scene.tweens.add({
                targets: circle,
                scale: 1.5,
                duration: 80,
                yoyo: true
            });
        }
    });

    scene.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
            if (!gameOver) {
                timeLeft--;
                timerText.setText('TIME: ' + Math.max(0, timeLeft));
                if (timeLeft <= 0) endGame(scene);
            }
        }
    });
}

function update() {}

function endGame(scene) {
    gameOver = true;
    circle.setVisible(false);
    glow.setVisible(false);
    const screenWidth = scene.sys.game.config.width;
    const screenHeight = scene.sys.game.config.height;

    scene.add.text(screenWidth/2, screenHeight/2 - 50, "GAME OVER", {
        fontSize: '48px', fontFamily: 'Arial Black', color: '#ff0055'
    }).setOrigin(0.5);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", score);
    }

    let restart = scene.add.dom(screenWidth/2, screenHeight/2 + 80, 'button', 
        'padding: 12px 30px; font-size: 22px; background: #00ff88; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;', 
        'RETRY');
    
    restart.addListener('click');
    restart.on('click', () => scene.scene.restart());
}
