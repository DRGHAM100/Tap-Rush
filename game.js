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

    // Background gradient 3D look
    let bg = scene.add.graphics();
    bg.fillGradientStyle(0x0f2027, 0x203a43, 0x2c5364, 0x000000, 1);
    bg.fillRect(0, 0, config.width, config.height);

    // UI - Score / Time / Best بالوسط
    scoreText = scene.add.text(config.width/2, 50, 'Score: 0', { 
        fontFamily: 'Arial Black', fontSize: '32px', color:'#00ffff', 
        stroke: '#000', strokeThickness:4 
    }).setOrigin(0.5);

    timerText = scene.add.text(config.width/2, 100, 'Time: 15', { 
        fontFamily: 'Arial Black', fontSize: '28px', color:'#ffcc00', 
        stroke: '#000', strokeThickness:4
    }).setOrigin(0.5);

    highScoreText = scene.add.text(config.width/2, 150, 'Best: ' + highScore, { 
        fontFamily: 'Arial Black', fontSize: '24px', color:'#00ff00', 
        stroke: '#000', strokeThickness:4
    }).setOrigin(0.5);

    // Circle 3D look
    circle = scene.add.circle(config.width/2, config.height/2+50, 80, 0x00ffcc)
        .setStrokeStyle(6, 0xffffff)
        .setInteractive();

    scene.tweens.add({
        targets: circle,
        scale: 1.1,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Particles
    particles = scene.add.particles(0, 0, null, { 
        speed: { min:-200, max:200 }, 
        scale:{start:0.8,end:0}, 
        lifespan:500, 
        quantity:10 
    });

    // Sound
    tapSound = scene.sound.add('tap');

    // START Button
    if (!gameStarted) {
        startBtn = scene.add.text(config.width/2, config.height-150, 'START', {
            fontSize: '36px', fontFamily:'Arial Black', color:'#00ffff', backgroundColor:'#000', padding:{x:20,y:10}
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
            timeLeft+=0.4;
            scoreText.setText('Score: '+score);

            // Move circle to random position
            let x = Phaser.Math.Between(80, config.width-80);
            let y = Phaser.Math.Between(200, config.height-100);
            circle.setPosition(x,y);

            circle.setFillStyle(Phaser.Display.Color.RandomRGB().color);
            particles.emitParticleAt(x,y);
            tapSound.play();
            if(navigator.vibrate) navigator.vibrate(30);

            if(score%10===0){
                timeLeft+=2;
                showText(scene,"🔥 BONUS +2s");
            }
        }
    });

    // Timer
    scene.time.addEvent({
        delay:1000,
        loop:true,
        callback:()=>{ 
            if(!gameOver){ 
                timeLeft--; 
                timerText.setText('Time: '+Math.floor(timeLeft)); 
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
        fontSize:'32px', fontFamily:'Arial Black', color:'#00ffff', backgroundColor:'#000', padding:{x:20,y:10}
    }).setOrigin(0.5).setInteractive();
    restart.on('pointerdown',()=>scene.scene.restart());
}

function showText(scene,msg,y){
    let txt = scene.add.text(config.width/2, y, msg, {
        fontFamily:'Arial Black', fontSize:'28px', color:'#fff', stroke:'#000', strokeThickness:4
    }).setOrigin(0.5);
    scene.tweens.add({ targets:txt, y:y-50, alpha:0, duration:1000, onComplete:()=>txt.destroy() });
}
