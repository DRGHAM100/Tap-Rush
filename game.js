let score = 0;
let timeLeft = 15;
let gameOver = false;
let highScore = localStorage.getItem("highScore") || 0;
let gameStarted = false;

let scoreText, timerText, highScoreText;
let circle, particles, tapSound;
let startBtn;

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game-container',
    scene: { preload, create, update },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};

new Phaser.Game(config);

function preload() {
    this.load.audio('tap', 'https://actions.google.com/sounds/v1/cartoon/pop.ogg');
}

function create() {
    let scene = this;

    // Background Gradient
    let bg = scene.add.graphics();
    bg.fillGradientStyle(0x0f2027, 0x203a43, 0x2c5364, 0x0f2027, 1);
    bg.fillRect(0, 0, config.width, config.height);

    // UI Text 3D look
    scoreText = scene.add.text(config.width/2, 50, 'Score: 0', { 
        fontFamily: 'Orbitron', fontSize: '36px', color:'#00ffff', 
        stroke: '#000', strokeThickness:5
    }).setOrigin(0.5);

    timerText = scene.add.text(config.width/2, 100, 'Time: 15', { 
        fontFamily: 'Orbitron', fontSize: '32px', color:'#ffcc00', 
        stroke: '#000', strokeThickness:5
    }).setOrigin(0.5);

    highScoreText = scene.add.text(config.width/2, 150, 'Best: ' + highScore, { 
        fontFamily: 'Orbitron', fontSize: '28px', color:'#00ff00', 
        stroke: '#000', strokeThickness:5
    }).setOrigin(0.5);

    // Circle أصغر
    circle = scene.add.circle(config.width/2, config.height/2+50, 60) // كان 80
        .setFillStyle(0x00ffcc)
        .setStrokeStyle(6, 0xffffff)
        .setInteractive();

    circle.setShadow(5, 5, '#000', 10, true, true);

    scene.tweens.add({
        targets: circle,
        scale: 1.05, // أقل شوي
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Particles
    particles = scene.add.particles(null);
    let emitter = particles.createEmitter({
        x: circle.x,
        y: circle.y,
        speed: { min:-200, max:200 },
        lifespan: 500,
        quantity: 8,
        scale: { start:0.6, end:0 },
        blendMode: 'ADD'
    });

    // Sound
    tapSound = scene.sound.add('tap');

    // START Button
    if (!gameStarted) {
        startBtn = scene.add.text(config.width/2, config.height-150, 'START', {
            fontSize: '40px', fontFamily:'Orbitron', color:'#00ffff', backgroundColor:'#000', padding:{x:25,y:15}
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerdown', () => {
            gameStarted = true;
            if(scene.sound.context.state === 'suspended') scene.sound.context.resume();
            scene.scene.restart();
        });
        return;
    }

    // Reset variables
    score=0; timeLeft=15; gameOver=false;

    // Tap Event - move circle randomly
    circle.on('pointerdown', ()=>{
        if(!gameOver){
            score++;
            scoreText.setText('Score: '+score);

            // Move circle smoothly
            let x = Phaser.Math.Between(60, config.width-60);
            let y = Phaser.Math.Between(200, config.height-100);
            scene.tweens.add({ targets: circle, x:x, y:y, duration:200, ease:'Power2' });

            // Random color
            let c = Phaser.Display.Color.RandomRGB();
            circle.setFillStyle(c.color);

            // Particles & Sound
            emitter.explode(10, circle.x, circle.y);
            tapSound.play();
            if(navigator.vibrate) navigator.vibrate(30);
        }
    });

    // Timer - ثابت
    scene.time.addEvent({
        delay:1000,
        loop:true,
        callback:()=>{ 
            if(!gameOver){ 
                timeLeft = Math.max(timeLeft-1, 0); // ما يقل عن 0
                timerText.setText('Time: '+timeLeft); 
                if(timeLeft<=0) endGame(scene); 
            }
        }
    });
}

function update(){}

function endGame(scene){
    gameOver=true;
    showText(scene,"GAME OVER",config.height/2-50);

    if(score>highScore){
        highScore=score;
        localStorage.setItem("highScore",score);
        showText(scene,"🏆 NEW RECORD!",config.height/2);
    }

    showText(scene,"Score: "+score,config.height/2+50);

    let restart = scene.add.text(config.width/2, config.height-150,'PLAY AGAIN',{
        fontSize:'36px', fontFamily:'Orbitron', color:'#00ffff', backgroundColor:'#000', padding:{x:25,y:15}
    }).setOrigin(0.5).setInteractive();
    restart.on('pointerdown',()=>scene.scene.restart());
}

function showText(scene,msg,y){
    let txt = scene.add.text(config.width/2, y, msg, {
        fontFamily:'Orbitron', fontSize:'32px', color:'#fff', stroke:'#000', strokeThickness:5
    }).setOrigin(0.5);
    scene.tweens.add({ targets:txt, y:y-50, alpha:0, duration:1000, onComplete:()=>txt.destroy() });
}
