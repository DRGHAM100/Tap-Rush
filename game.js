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
    dom: { createContainer: true }, // لتفعيل أزرار HTML/CSS
    scene: { preload, create, update },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);

function preload() {
    // تحميل الصوت
    this.load.audio('tap', 'https://actions.google.com/sounds/v1/cartoon/pop.ogg');
    // إذا كان لديك لوغو باسم logo.png ضعه في مجلد assets
    this.load.image('logo', 'assets/logo.jpeg'); 
}

function create() {
    let scene = this;

    // --- شاشة البداية ---
    if (!gameStarted) {
        let bgStart = scene.add.graphics();
        bgStart.fillGradientStyle(0x0a0f1a, 0x0a0f1a, 0x1a2a6c, 0x1a2a6c, 1);
        bgStart.fillRect(0, 0, config.width, config.height);

        // نص العنوان (أو اللوغو)
        scene.add.text(config.width/2, config.height/3, 'TAP RUSH', {
            fontSize: '70px',
            fontFamily: 'Arial Black',
            color: '#00f2ff'
        }).setOrigin(0.5).setStroke('#0055ff', 10);

        // زر البداية بتصميم CSS
        startBtn = scene.add.dom(config.width/2, config.height * 0.7, 'button', 
            'padding: 15px 50px; font-size: 30px; background: linear-gradient(to bottom, #00f2ff, #0055ff); border: none; border-radius: 50px; color: white; cursor: pointer; box-shadow: 0 0 25px #00f2ff; font-weight: bold;', 
            'START GAME');
        
        startBtn.addListener('click');
        startBtn.on('click', () => {
            gameStarted = true;
            scene.scene.restart();
        });
        return;
    }

    // --- خلفية اللعب (الستايل النيوني) ---
    let bg = scene.add.graphics();
    bg.fillStyle(0x0a0f1a, 1);
    bg.fillRect(0, 0, config.width, config.height);
    
    // رسم شبكة (Grid) خفيفة مثل التصاميم الاحترافية
    bg.lineStyle(1, 0x00f2ff, 0.1);
    for(let i=0; i<config.width; i+=50) bg.lineBetween(i, 0, i, config.height);
    for(let i=0; i<config.height; i+=50) bg.lineBetween(0, i, config.width, i);

    score = 0;
    timeLeft = 15;
    gameOver = false;

    // نصوص الواجهة (UI)
    const textStyle = { fontFamily: 'Arial Black', fontWeight: 'bold' };
    scoreText = scene.add.text(config.width/2, 60, 'SCORE: 0', { ...textStyle, fontSize: '40px', color: '#00f2ff' }).setOrigin(0.5);
    timerText = scene.add.text(config.width/2, 120, 'TIME: 15', { ...textStyle, fontSize: '30px', color: '#ffcc00' }).setOrigin(0.5);
    highScoreText = scene.add.text(config.width/2, 170, 'BEST: ' + highScore, { ...textStyle, fontSize: '20px', color: '#00ff88' }).setOrigin(0.5);

    // --- الدائرة وتأثير الوهج (حل مشكلة Shadow) ---
    glow = scene.add.circle(config.width/2, config.height/2, 85, 0x00f2ff, 0.3); // التوهج
    circle = scene.add.circle(config.width/2, config.height/2, 75, 0x00f2ff).setInteractive(); // الدائرة الأساسية

    // أنيميشن النبض (Pulse)
    scene.tweens.add({
        targets: [circle, glow],
        scale: 1.1,
        duration: 800,
        yoyo: true,
        repeat: -1
    });

    // جزيئات الانفجار (Particles)
    particles = scene.add.particles(0, 0, null, {
        speed: { min: -200, max: 200 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 600,
        blendMode: 'ADD',
        tint: 0x00f2ff
    });

    tapSound = scene.sound.add('tap');

    // --- منطق الضغط والتحرك ---
    circle.on('pointerdown', () => {
        if (!gameOver) {
            score++;
            scoreText.setText('SCORE: ' + score);

            // تغيير المكان عشوائياً
            let newX = Phaser.Math.Between(100, config.width - 100);
            let newY = Phaser.Math.Between(250, config.height - 100); // تجنب النصوص في الأعلى

            circle.setPosition(newX, newY);
            glow.setPosition(newX, newY);

            // تأثير بصري سريع
            particles.emitParticleAt(newX, newY);
            tapSound.play();
            
            if (navigator.vibrate) navigator.vibrate(30);

            // أنيميشن عند الضغط
            scene.tweens.add({
                targets: circle,
                scale: 1.4,
                duration: 100,
                yoyo: true
            });
        }
    });

    // --- المؤقت ---
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

    scene.add.text(config.width/2, config.height/2 - 100, "GAME OVER", {
        fontSize: '64px', fontFamily: 'Arial Black', color: '#ff0055'
    }).setOrigin(0.5);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", score);
    }

    // زر إعادة اللعب
    let restart = scene.add.dom(config.width/2, config.height/2 + 80, 'button', 
        'padding: 15px 40px; font-size: 25px; background: #00ff88; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;', 
        'PLAY AGAIN');
    
    restart.addListener('click');
    restart.on('click', () => scene.scene.restart());
}
