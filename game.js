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
    scale: {
        mode: Phaser.Scale.ENVELOP,
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

    // --- 1. حركات شاشة البداية المحدثة ---
    if (!gameStarted) {
        let bgStart = scene.add.graphics();
        bgStart.fillGradientStyle(0x0a0f1a, 0x0a0f1a, 0x1a2a6c, 0x1a2a6c, 1);
        bgStart.fillRect(0, 0, screenWidth, screenHeight);

        let titleText = scene.add.text(screenWidth/2, -100, 'TAP RUSH', {
            fontSize: '12vw',
            fontFamily: 'Arial Black',
            color: '#00f2ff'
        }).setOrigin(0.5).setStroke('#0055ff', 8);

        // أنيميشن دخول العنوان
        scene.tweens.add({
            targets: titleText,
            y: screenHeight/3,
            duration: 1000,
            ease: 'Bounce.easeOut',
            delay: 200
        });

        startBtn = scene.add.dom(screenWidth/2, screenHeight + 100, 'button', 
            'padding: 15px 40px; font-size: 24px; background: linear-gradient(to bottom, #00f2ff, #0055ff); border: none; border-radius: 50px; color: white; cursor: pointer; box-shadow: 0 0 20px #00f2ff; font-weight: bold; width: 200px; opacity: 0;', 
            'START');
        
        // أنيميشن ظهور الزر
        scene.tweens.add({
            targets: startBtn,
            y: screenHeight * 0.7,
            alpha: 1,
            duration: 800,
            ease: 'Back.easeOut',
            delay: 1000
        });

        startBtn.addListener('click');
        startBtn.on('click', () => {
            gameStarted = true;
            scene.scene.restart();
        });
        return;
    }

    // --- خلفية اللعب (Cyber Grid) ---
    let bg = scene.add.graphics();
    bg.fillStyle(0x0a0f1a, 1);
    bg.fillRect(0, 0, screenWidth, screenHeight);
    
    bg.lineStyle(1, 0x00f2ff, 0.05); // خطوط أخف لتركيز البصر على الحركة
    for(let i=0; i<screenWidth; i+=40) bg.lineBetween(i, 0, i, screenHeight);
    for(let i=0; i<screenHeight; i+=40) bg.lineBetween(0, i, screenWidth, i);

    score = 0;
    timeLeft = 15;
    gameOver = false;

    // --- 2. أنيميشن دخول واجهة المستخدم (UI) ---
    const textStyle = { fontFamily: 'Arial Black', fontWeight: 'bold' };
    
    scoreText = scene.add.text(screenWidth/2, -50, 'SCORE: 0', { ...textStyle, fontSize: '32px', color: '#00f2ff' }).setOrigin(0.5);
    timerText = scene.add.text(screenWidth/2, -50, 'TIME: 15', { ...textStyle, fontSize: '24px', color: '#ffcc00' }).setOrigin(0.5);
    highScoreText = scene.add.text(screenWidth/2, -50, 'BEST: ' + highScore, { ...textStyle, fontSize: '18px', color: '#00ff88' }).setOrigin(0.5);

    // حركة سقوط النصوص
    scene.tweens.add({ targets: scoreText, y: 50, duration: 600, ease: 'Back.easeOut', delay: 100 });
    scene.tweens.add({ targets: timerText, y: 95, duration: 600, ease: 'Back.easeOut', delay: 300 });
    scene.tweens.add({ targets: highScoreText, y: 130, duration: 600, ease: 'Back.easeOut', delay: 500 });

    // --- 3. تصميم الدائرة والوهج المتقدم ---
    glow = scene.add.circle(screenWidth/2, screenHeight/2, 45, 0x00f2ff, 0); // نبدأ بشفافية 0
    circle = scene.add.circle(screenWidth/2, screenHeight/2, 40, 0x00f2ff).setInteractive();

    // أنيميشن وهج متطور (تغير الحجم والشفافية معاً)
    scene.tweens.add({
        targets: glow,
        scale: 1.3,
        alpha: 0.4,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // --- 4. تحديث تأثير الجزيئات (Particles) ---
    particles = scene.add.particles(0, 0, null, {
        speed: { min: -100, max: 100 },
        angle: { min: 0, max: 360 }, // انتشار في كل الاتجاهات
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 100, // سحب لأسفل خفيف
        rotate: { start: 0, end: 360 }, // دوران الجزيئات
        lifespan: 500,
        blendMode: 'ADD',
        tint: 0x00f2ff
    });

    tapSound = scene.sound.add('tap');

    // --- 5. منطق الضغط وحركة "الشبح" (Ghost Trail) ---
    circle.on('pointerdown', () => {
        if (!gameOver) {
            score++;
            scoreText.setText('SCORE: ' + score);

            let oldX = circle.x;
            let oldY = circle.y;

            // مكان عشوائي جديد
            let newX = Phaser.Math.Between(50, screenWidth - 50);
            let newY = Phaser.Math.Between(180, screenHeight - 80);

            // --- تأثير الشبح (Trail Effect) ---
            let ghost = scene.add.circle(oldX, oldY, 40, 0x00f2ff, 0.6);
            scene.tweens.add({
                targets: ghost,
                scale: 0.1,
                alpha: 0,
                duration: 300,
                onComplete: () => ghost.destroy() // حذف الشبح بعد انتهاء الحركة
            });

            // نقل الدائرة للمكان الجديد
            circle.setPosition(newX, newY);
            glow.setPosition(newX, newY);

            // انفجار الجزيئات في المكان الجديد
            particles.emitParticleAt(newX, newY);
            tapSound.play();
            
            if (navigator.vibrate) navigator.vibrate(25);

            // أنيميشن تأكيد الضغطة (تصغير ثم تكبير)
            scene.tweens.add({
                targets: circle,
                scale: { start: 0.5, to: 1.6 },
                duration: 120,
                yoyo: true,
                ease: 'Back.easeOut'
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
                
                // أنيميشن تحذير عند بقاء 5 ثواني (لون أحمر ونبض سريع)
                if (timeLeft <= 5 && timeLeft > 0) {
                    timerText.setColor('#ff4444');
                    scene.tweens.add({ targets: timerText, scale: 1.2, duration: 100, yoyo: true });
                }

                if (timeLeft <= 0) endGame(scene);
            }
        }
    });
}

function update() {}

// --- 6. حركات شاشة النهاية (Dramatized End) ---
function endGame(scene) {
    gameOver = true;
    circle.setVisible(false);
    glow.setVisible(false);
    const screenWidth = scene.sys.game.config.width;
    const screenHeight = scene.sys.game.config.height;

    // اهتزاز الكاميرا
    scene.cameras.main.shake(300, 0.01);

    let goText = scene.add.text(screenWidth/2, screenHeight/2 - 50, "GAME OVER", {
        fontSize: '48px', fontFamily: 'Arial Black', color: '#ff0055'
    }).setOrigin(0.5).setScale(0);

    // أنيميشن ظهور "Game Over" مع دوران
    scene.tweens.add({
        targets: goText,
        scale: 1,
        angle: 360,
        duration: 800,
        ease: 'Back.easeOut'
    });

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", score);
        
        // نص "الرقم القياسي" يظهر بعد فترة
        scene.time.delayedCall(1000, () => {
            scene.add.text(screenWidth/2, screenHeight/2 + 10, "🏆 NEW BEST!", {
                fontSize: '24px', color: '#00ff88', fontWeight: 'bold'
            }).setOrigin(0.5);
        });
    }

    let restart = scene.add.dom(screenWidth/2, screenHeight + 100, 'button', 
        'padding: 12px 30px; font-size: 22px; background: #00ff88; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; opacity: 0;', 
        'RETRY');
    
    scene.tweens.add({
        targets: restart,
        y: screenHeight/2 + 100,
        alpha: 1,
        duration: 800,
        ease: 'Back.easeOut',
        delay: 1500
    });

    restart.addListener('click');
    restart.on('click', () => scene.scene.restart());
}
