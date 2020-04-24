let canvas;
let ctx;
let canvasWidth = 2400;
let canvasHeight = 1350;
let mainThemeAudio;
let correctButton;
let muted = true;
// let canvasWidth = 3840;
// let canvasHeight = 2160;
let keys = [];
let ship;
let bullets = [];
let asteroids = [];
let gates = [];
let geoms = [];
let particles = [];
let stars = [];
let wax = [];
let numWaxedOn = 0;
let waxingOn = true
let starCount = 1000;
let score = 0;
let multiplier = 1;
let lives = 1;
const CUBE_CELL_SIZE = 15;
const WAX_CELL_SIZE = 50;
let cubesSpatialHash = new SpatialHashMap(CUBE_CELL_SIZE);
let waxSpatialHash = new SpatialHashMap(WAX_CELL_SIZE);
let gamePlaying=true;
let gamepads = navigator.getGamepads();

// HOMEWORK SOLUTION - Contributed by luckyboysunday
let highScore;
let newHighScore = false;
let localStorageName = "HighScore";

let lastFrameTimeMs = 0;
let maxFPS = 60;
let fps = 60;
let timestep = 1000 / maxFPS;
let framesThisSecond = 0;
let lastFpsUpdate = 0;

// Re-adjust the velocity now that it's not dependent on FPS
let delta = 0,
spawnCount = 4,
spawnCountIncrement = 0,
timeSinceStart=0,
timeSinceLastCubeSpawn=0,
timeSinceEnteredGate=0,
gateMultiplier=1,
timeSinceLastGateSpawn=0;

document.addEventListener('DOMContentLoaded', SetupCanvas);
window.addEventListener("gamepadconnected", (event) => {
    console.log("A gamepad connected:");
    console.log(event.gamepad);
});

window.addEventListener("gamepaddisconnected", (event) => {
    console.log("A gamepad disconnected:");
    console.log(event.gamepad);
});

   

function SetupCanvas(){
    mainThemeAudio =  new Audio("Audio/geometry-wars-retro-evolved-2-evolved-theme-hq.mp3");
    mainThemeAudio.loop = true;
    correctButton = document.getElementById("correct");
    correctButton.addEventListener("click", function(){ 
        if(muted){
            correctButton.textContent = "Mute Sound"
            muted = false;
            if(mainThemeAudio.muted){
                mainThemeAudio.muted = false; 
            }else{
                mainThemeAudio.play();
            }
        }else{
            correctButton.textContent = "Play Sound"
            muted = true;
            mainThemeAudio.muted = true;
        }
    });

    canvas = document.getElementById("my-canvas");
    ctx = canvas.getContext("2d");
    // canvas.width = canvasWidth/1.5;
    // canvas.height = canvasHeight/1.5;
    canvas.width = 2000;
    canvas.height = 1125;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ship = new Ship();
    
    document.body.addEventListener("keydown", HandleKeyDown);
    document.body.addEventListener("keyup", HandleKeyUp);
    
    if (localStorage.getItem(localStorageName) == null) {
        highScore = 0;
    } else {
        highScore = localStorage.getItem(localStorageName);
    }

    for(let y = 0; y<starCount; y++){          
        stars.push(new Star());
    }
    CreateWax(5,5);

    MainLoop();
}

function HandleKeyDown(e){
    keys[e.keyCode] = true;
}
function HandleKeyUp(e){
    keys[e.keyCode] = false;
}
 
class Ship {
    constructor() {
        this.visible = true;
        this.pos = new Vector2(canvasWidth / 2, canvasHeight / 2);
        this.movingForward = false;
        this.speed = 0.5;
        this.vel = new Vector2(0,0);
        this.maxVel = 0.75;
        this.radius = 5;
        this.angle = 0;
        this.strokeColor = 'white';
        this.history = [];
        this.tailLength = 5;
        this.boost = false;
    }
    Died() {
        ship.history = [];
        ship.pos.x = canvasWidth / 2;
        ship.pos.y = canvasHeight / 2;
        ship.vel.x = 0;
        ship.vel.y = 0;
        lives -= 1;
    }
    Update(delta) {
        let axes = new Vector2(0,0), axes2;
        let keyboardUsed=false;

        // Check if the ship is moving forward
        if(gamepads[0]){
            axes = new Vector2(gamepads[0].axes[0].toFixed(2),gamepads[0].axes[1].toFixed(2));
            // axes2 = new Vector2(gamepads[0].axes[2].toFixed(2),gamepads[0].axes[3].toFixed(2));        
        }
        if(keys[87] || keys[38]){
            axes.y = -1;
            keyboardUsed=true;
        }else if(keys[83] || keys[40]){
            axes.y = 1;
            keyboardUsed=true;
        }
        if (keys[68] || keys[39]){
            axes.x = 1;
            keyboardUsed=true;
        } else if (keys[65] || keys[37]){
            axes.x = -1;
            keyboardUsed=true;
        }
        if(keyboardUsed){
            axes=axes.normalize();
        } 
        // console.log(axes);
        // If moving forward calculate changing values of x & y
        // If you want to find the new point x use the 
        // formula oldX + cos(radians) * distance
        // Forumla for y oldY + sin(radians) * distance
        if(axes.x>-0.1&&axes.x<0.1&&axes.y>-0.1&&axes.y<0.1){
            // Slow ship speed when not holding key
            this.vel.x *= 0.9;
            this.vel.y *= 0.9;
        }else{
            this.vel.x += axes.x * this.speed;
            this.vel.y += axes.y * this.speed;
            // console.log(this.maxVel);
            if(this.vel.magnitude()>this.maxVel){
                var normalizedVel = this.vel.normalize();
                this.vel = new Vector2(normalizedVel.x*this.maxVel,normalizedVel.y*this.maxVel);
            }
        }

        // if (!((axes2.x<0.1&&axes2.x>-0.1)||(axes2.y<0.1&&axes2.y>-0.1))){
        //     bullets.push(new Bullet(axes2.normalize()));
        // }


        let d = this.radius*2;
        if (this.pos.x < d) {
            this.pos.x = d;
        }else if (this.pos.x > canvasWidth-d) {
            this.pos.x = canvasWidth-d;
        }
        if (this.pos.y < d) {
            this.pos.y = d;
        } else if (this.pos.y > canvasHeight-d) {
            this.pos.y = canvasHeight-d;
        }

        this.history.push(new Vector2(this.pos.x.toFixed(10),this.pos.y.toFixed(10)));
        if(this.history.length>this.tailLength){
            this.history.splice(0,1);
        }

        // Change value of x & y while accounting for
        // air friction
        if(this.boost){
            this.boost = false;
            this.pos.x += (this.vel.x * delta * 1.25);
            this.pos.y += (this.vel.y * delta * 1.25);
        }else{
            this.pos.x += (this.vel.x * delta);
            this.pos.y += (this.vel.y * delta);
        }

        let waxlist = waxSpatialHash.getList(this);
        if(waxlist.length>0){
            waxlist[0].CheckWaxCell();
        }
    }
    Draw() {
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = 2;

        ctx.beginPath();
        smooth(ctx, this.history);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 10, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
    }
}

function smooth(ctx, points)
{
    if(points == undefined || points.length == 0)
    {
        return true;
    }
    if(points.length == 1)
    {
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[0].x, points[0].y);
        return true;
    }
    if(points.length == 2)
    {
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        return true;
    }
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length - 2; i ++)
    {
        var xc = (points[i].x + points[i + 1].x) / 2;
        var yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
}

class Bullet{
    constructor(direction) {
        this.visible = true;
        this.pos = new Vector2(ship.pos.x, ship.pos.y);
        this.direction = direction;
        this.height = 4;
        this.width = 4;
        this.speed = 1.5;
        this.vel = new Vector2(0,0);
    }
    Update(delta){
        this.pos.x += this.direction.x * this.speed * delta;
        this.pos.y += this.direction.y * this.speed * delta;
    }
    Draw(){
        ctx.fillStyle = 'white';
        ctx.fillRect(this.pos.x,this.pos.y,this.width,this.height);
    }
}
 
class Asteroid{
    constructor(pos,radius,level) {
        this.visible = true;
        this.pos = pos || new Vector2(Math.floor(Math.random() * canvasWidth), Math.floor(Math.random() * canvasHeight));
        // this.layer = layer;
        this.speed = 0.3;
        this.radius = radius || 15;
        this.direction = (ship.pos.subtract(this.pos)).normalize();
        this.strokeColor = 'white';
        this.collisionRadius = this.radius;
        // Used to decide if this asteroid can be broken into smaller pieces
        this.level = level || 1;
    }

    UpdateDirections(){
       this.direction = (ship.pos.subtract(this.pos)).normalize();
    }

    Update(delta){
        this.pos.x += this.direction.x * this.speed * delta;
        this.pos.y += this.direction.y * this.speed * delta;

        if (this.pos.x < this.radius) {
            this.pos.x = this.radius;
        }else if (this.pos.x > canvasWidth-this.radius) {
            this.pos.x = canvasWidth-this.radius;
        }
        if (this.pos.y < this.radiusd) {
            this.pos.y = this.radius;
        } else if (this.pos.y > canvasHeight-this.radius) {
            this.pos.y = canvasHeight-this.radius;
        }
        let sublist = cubesSpatialHash.getList(this);            
        for(let s = 0; s < sublist.length; s++){
            if(sublist[s]!=this) ResolveCollision(this, sublist[s]);
        }
    }
    PreventAsteroidsFromColliding(asteroid){
        let difX = this.pos.x-asteroid.pos.x;
        if(Math.abs(difX)<=this.radius){
            if(this.direction.x>=0){
                this.pos.x -= (difX-this.radius);
            }else {
                this.pos.x -= (difX+this.radius);
            }
        }
        
        let difY = this.pos.y-asteroid.pos.y;
        if(Math.abs(difY)<=this.radius){
            if(this.direction.y>=0){
                this.pos.y -= (difY-this.radius);
            }else {
                this.pos.y -= (difY+this.radius);
            }
        }
    }

    Draw(){
        ctx.beginPath();

        ctx.lineTo(this.pos.x - this.radius, this.pos.y - this.radius);
        ctx.lineTo(this.pos.x - this.radius, this.pos.y + this.radius);
        ctx.lineTo(this.pos.x + this.radius, this.pos.y + this.radius);
        ctx.lineTo(this.pos.x + this.radius, this.pos.y - this.radius);
        
        // ctx.lineTo(this.pos.x - this.radius, this.pos.y);
        // ctx.lineTo(this.pos.x, this.pos.y + this.radius);
        // ctx.lineTo(this.pos.x + this.radius, this.pos.y);
        // ctx.lineTo(this.pos.x, this.pos.y - this.radius);

		ctx.strokeStyle = "#FF0000";
		ctx.strokeStyle = "#00FF00";
		ctx.strokeStyle = "#0088FF";
		ctx.lineWidth= 3;

        ctx.closePath();
        ctx.stroke();
    }
}

class Gate {
    constructor(radius,level) {
        this.visible = true;
        do{
            this.pos = new Vector2(Math.floor(Math.random() * (canvasWidth-100)), Math.floor(Math.random() * (canvasHeight-100)));
        }while(this.pos.distance(ship.pos)<200);

        // this.layer = layer;
        this.angle = Math.floor(Math.random()*359);
        this.radians;
        this.speed = 0.05+(Math.random()*0.1);
        this.rotateSpeed = 0.00002;
        this.updateDirectionDelay=0;
        this.movementDirection = new Vector2(-1+(Math.random()*2), -1+(Math.random()*2)).normalize();
        this.radius = radius || 75;
        this.explodeRadius = 270;
        this.exploded = false;
        this.readyToDestroy = false;
        this.radiusOfExplosion = 0;
        this.leftPos;
        this.rightPos;
    }
    
    Intersects(ship) {
        let p, q, r, s;
        if(ship.history.length>4){
            p = ship.history[0].x,
            q = ship.history[0].y,
            r = ship.history[4].x,
            s = ship.history[4].y;
        }else{
            p = ship.pos.x,
            q = ship.pos.y,
            r = ship.pos.x,
            s = ship.pos.y;
        }
    
        var det, gamma, lambda;
        det = (this.rightPos.x - this.leftPos.x) * (s - q) - (r - p) * (this.rightPos.y - this.leftPos.y);
        if (det === 0) {
          return false;
        } else {
          lambda = ((s - q) * (r - this.leftPos.x) + (p - r) * (s - this.leftPos.y)) / det;
          gamma = ((this.leftPos.y - this.rightPos.y) * (r - this.leftPos.x) + (this.rightPos.x - this.leftPos.x) * (s - this.leftPos.y)) / det;
          return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    }
    
    Explode() {

        if(timeSinceEnteredGate<1000){
            gateMultiplier++;
        }else{
            gateMultiplier=1;
        }
        timeSinceEnteredGate = 0;

        if (asteroids.length !== 0) {
            for(let k = 0; k < asteroids.length; k++){
                if((CircleCollision(this.leftPos.x, this.leftPos.y, this.explodeRadius, asteroids[k].pos.x, asteroids[k].pos.y, asteroids[k].collisionRadius))
                 ||(CircleCollision(this.rightPos.x, this.rightPos.y, this.explodeRadius, asteroids[k].pos.x, asteroids[k].pos.y, asteroids[k].collisionRadius))){
                    let pos = new Vector2(asteroids[k].pos.x, asteroids[k].pos.y); 
                    geoms.push(new Geom(pos));
                    for(let i = 0; i < 360; i+=40){
                        pos = new Vector2(asteroids[k].pos.x, asteroids[k].pos.y); 
                        particles.push(new Particle(pos, i, 200));
                            // '#0088ff'));
                    }
                    asteroids.splice(k,1);
                    // if(!muted) explosionSFX.play();
                    score+=(5*multiplier);
                    k--;
                }
            }
        }
        this.exploded = true;
        score+=(10*multiplier*gateMultiplier);
    }

    Update(delta){
        if(!this.exploded){
            this.updateDirectionDelay+=delta;
            if(this.updateDirectionDelay>1000){
                this.updateDirectionDelay = 0;
                this.movementDirection = new Vector2(-1+(Math.random()*2), -1+(Math.random()*2)).normalize();
                this.speed = 0.05+(Math.random()*0.1);
            } 
            
            this.angle += this.rotateSpeed * delta;
            if(this.angle>=360){
                this.angle=0;
            }
            this.radians = this.angle / Math.PI * 180;

            this.pos.x += this.movementDirection.x * this.speed * delta;
            this.pos.y += this.movementDirection.y * this.speed * delta;

            this.leftPos = new Vector2(this.pos.x-(Math.cos(this.radians)*this.radius), this.pos.y-(Math.sin(this.radians)*this.radius));
            this.rightPos = new Vector2(this.pos.x+(Math.cos(this.radians)*this.radius), this.pos.y+(Math.sin(this.radians)*this.radius));
            
            if (this.pos.x < this.radius) {
                this.pos.x = this.radius;
                this.movementDirection.x=-this.movementDirection.x;
            }else if (this.pos.x > canvasWidth-this.radius) {
                this.pos.x = canvasWidth-this.radius;
                this.movementDirection.x=-this.movementDirection.x;
            }
            if (this.pos.y < this.radius) {
                this.pos.y = this.radius;
                this.movementDirection.y=-this.movementDirection.y;
            } else if (this.pos.y > canvasHeight-this.radius) {
                this.pos.y = canvasHeight-this.radius;
                this.movementDirection.y=-this.movementDirection.y;
            }

            if(this.leftPos.distance(ship.pos)<12||this.rightPos.distance(ship.pos)<12){
                ship.Died();
            }
        }else{
            this.radiusOfExplosion+=50;
            if(this.radiusOfExplosion>this.explodeRadius){
                this.readyToDestroy=true;
            }
        }
    }

    Draw() {
        if(this.exploded){            
            ctx.strokeStyle = 'orange';
            ctx.fillStyle = 'orange';

            ctx.beginPath();
            ctx.arc(this.leftPos.x, this.leftPos.y, this.radiusOfExplosion, 0, 2 * Math.PI)
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(this.rightPos.x, this.rightPos.y, this.radiusOfExplosion, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.stroke();
        }else{
            ctx.strokeStyle = "#00CCFF";
            ctx.beginPath();
            ctx.moveTo(this.leftPos.x, this.leftPos.y);
            ctx.lineTo(this.rightPos.x, this.rightPos.y);
            ctx.stroke(); 
            
            ctx.strokeStyle = 'orange';
            ctx.fillStyle = 'orange';

            ctx.beginPath();
            ctx.arc(this.leftPos.x, this.leftPos.y, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();

            ctx.beginPath();
            ctx.arc(this.rightPos.x, this.rightPos.y, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = 'white';
        }
    }
}

class Geom {
    constructor(pos,radius) {
        this.visible = true;
        this.pos = pos || new Vector2(Math.floor(Math.random() * canvasWidth), Math.floor(Math.random() * canvasHeight));
        this.speed = 0.1;
        this.radius = radius || 1.5;    
        this.collectRadius = 200;        
        this.d = this.radius * 2;
        this.directions = new Vector2(-1+(Math.random()*2), -1+(Math.random()*2)).normalize();
        this.timeSinceSpawn = 0;
        this.destroyed = false;
    }
    
    Update(delta){
        this.timeSinceSpawn+=delta;
        if(this.timeSinceSpawn>2500){
            this.destroyed = true;
            return;
        }
        let dist = this.pos.distance(ship.pos);
        if(dist<this.collectRadius){
            this.speed = 1;
            this.directions = ship.pos.subtract(this.pos).normalize();
            if(dist<15){
                this.directions = ship.pos.subtract(this.pos).normalize();
                this.destroyed = true;
                multiplier++;
                return;
            }
        }

        this.pos.x += this.directions.x * this.speed * delta;
        this.pos.y += this.directions.y * this.speed * delta;
        
        if (this.pos.x < this.d) {
            this.pos.x = this.d;
            this.directions.x=-this.directions.x;
            this.directions.y=-this.directions.y;
        }else if (this.pos.x > canvasWidth-this.d) {
            this.pos.x = canvasWidth-this.d;
            this.directions.x=-this.directions.x;
            this.directions.y=-this.directions.y;
        }
        if (this.pos.y < this.d) {
            this.pos.y = this.d;
            this.directions.x=-this.directions.x;
            this.directions.y=-this.directions.y;
        } else if (this.pos.y > canvasHeight-this.d) {
            this.pos.y = canvasHeight-this.d;
            this.directions.x=-this.directions.x;
            this.directions.y=-this.directions.y;
        }
    }

    Draw() {
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.d, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();        
    }
}

class Particle {
    constructor(pos,angle,timeToBeAlive,color) {
        this.pos = pos;
        this.speed = 1;
        this.radius = 1.5;
        this.d = this.radius*2;
        this.angle = angle;
        this.radians = this.angle / 180 * Math.PI;
        this.direction = new Vector2(Math.cos(this.radians) * this.speed, Math.sin(this.radians)* this.speed);
        this.timeToBeAlive = timeToBeAlive+(Math.floor(Math.random()*timeToBeAlive));
        this.timeSinceSpawn = 0;
        this.destroyed = false;
        this.color = color || '#' + (0x1000000 + Math.random() * 0xFFFFFF).toString(16).substr(1,6);
    }
    
    Update(delta){
        this.timeSinceSpawn+=delta;
        if(this.timeSinceSpawn>this.timeToBeAlive){
            this.destroyed = true;
            return;
        }
        this.pos.x += this.direction.x * delta;
        this.pos.y += this.direction.y * delta;
        
        if (this.pos.x < this.d) {
            this.pos.x = this.d;
            this.direction.x=-this.direction.x;
            this.direction.y=-this.direction.y;
        }else if (this.pos.x > canvasWidth-this.d) {
            this.pos.x = canvasWidth-this.d;
            this.direction.x=-this.direction.x;
            this.direction.y=-this.direction.y;
        }
        if (this.pos.y < this.d) {
            this.pos.y = this.d;
            this.direction.x=-this.direction.x;
            this.direction.y=-this.direction.y;
        } else if (this.pos.y > canvasHeight-this.d) {
            this.pos.y = canvasHeight-this.d;
            this.direction.x=-this.direction.x;
            this.direction.y=-this.direction.y;
        }
    }

    Draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.d, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }
}

class Star {
    constructor() {
        this.pos = new Vector2(canvasWidth + Math.floor(-canvasWidth+(Math.random() * canvasWidth)), Math.floor(Math.random() * canvasHeight));
        this.d = Math.ceil(Math.random() * 1);
    }

    Draw() {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.d, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();        
    }
}

function CircleCollision(p1x, p1y, r1, p2x, p2y, r2){
    let radiusSum;
    let xDiff;
    let yDiff;
 
    radiusSum = r1 + r2;
    xDiff = p1x - p2x;
    yDiff = p1y - p2y;
 
    if (radiusSum > Math.sqrt((xDiff * xDiff) + (yDiff * yDiff))) {
        return true;
    } else {
        return false;
    }
}

class Wax {
    constructor(x,y,x2,y2) {
        this.visible = false;
        this.startPos = new Vector2(x,y);
        this.endPos = new Vector2(x2,y2);
        this.waxed = false;
    }

    CheckWaxCell() {
        if(waxingOn) {
            if(!this.waxed){
                ship.boost=true;
                if(numWaxedOn<wax.length){
                    this.visible = this.waxed = true;
                    numWaxedOn++;
                    if(numWaxedOn==wax.length){
                        waxingOn=false;
                    }
                }
            }
        }else {
            if(this.waxed){
                ship.boost=true;
                if(numWaxedOn>0){
                    this.visible = this.waxed = false;
                    numWaxedOn--;                    
                    if(numWaxedOn==0){
                        waxingOn=true;
                        
                        for(let i = 0; i < 1000; i++){
                            let pos = new Vector2(Math.floor(Math.random() * canvasWidth), Math.floor(Math.random() * canvasHeight)); 
                            particles.push(new Particle(pos, Math.floor(Math.random() * 359), 1000));
                        }
                    }
                }
            }
        }
    }

    Draw() {
        if(this.visible){
            ctx.beginPath();
            ctx.lineTo(this.startPos.x, this.startPos.y);
            ctx.lineTo(this.endPos.x, this.endPos.y);
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
        
            ctx.closePath();
            ctx.stroke();
        }              
    }
}

function CreateWax(w,h) {
    wax = [];
    waxSpatialHash = new SpatialHashMap(WAX_CELL_SIZE);
    waxingOn=true;
    numWaxedOn = 0;
    var X, Y;  
    let x = -w;
    let y = h;
    while(y<canvasHeight-h){
        X = Math.round(x / 50) * 50;
        Y = Math.round(y / 50) * 50;
        let w = new Wax(x,y,x,y+40);
        waxSpatialHash.addObj(X+","+Y, w);
        wax.push(w);
        y+=50;
    }
    x+=w*2;
    while(x<canvasWidth-w){
        X = Math.round(x / 50) * 50;
        Y = Math.round(y / 50) * 50;
        let w = new Wax(x,y,x+40,y);
        waxSpatialHash.addObj(X+","+Y, w);
        wax.push(w);
        x+=50;
    }
    y-=h*2;
    while(y>h){
        X = Math.round(x / 50) * 50;
        Y = Math.round(y / 50) * 50;
        let w = new Wax(x,y,x,y-40);
        waxSpatialHash.addObj(X+","+Y, w);
        wax.push(w);
        y-=50;
    }
    x-=w*2;
    while(x>w){
        X = Math.round(x / 50) * 50;
        Y = Math.round(y / 50) * 50;
        let w = new Wax(x,y,x-40,y);
        waxSpatialHash.addObj(X+","+Y, w);
        wax.push(w);
        x-=50;
    }
}

function ResolveCollision(A, B) {
    // get the vectors to check against
    var vX = (A.pos.x + A.radius)  - (B.pos.x + B.radius),
        vY = (A.pos.y + A.radius) - (B.pos.y + B.radius),
        // Half widths and half heights of the objects
        ww2 = A.radius + B.radius,
        hh2 = A.radius + B.radius,
        colDir = "";

    // if the x and y vector are less than the half width or half height,
    // they we must be inside the object, causing a collision
    if (Math.abs(vX) < ww2 && Math.abs(vY) < hh2) {
        // figures out on which side we are colliding (top, bottom, left, or right)
        var oX = ww2 - Math.abs(vX),
            oY = hh2 - Math.abs(vY);
        if (oX >= oY) {
            if (vY > 0) {
                // colDir = "TOP";
                A.pos.y += oY;
            } else {
                // colDir = "BOTTOM";
                A.pos.y -= oY;
            }
        } else {
            if (vX > 0) {
                // colDir = "LEFT";
                A.pos.x += oX;
            } else {
                // colDir = "RIGHT";
                A.pos.x -= oX;
            }
        }
    }
    // return colDir; // If you need info of the side that collided
}

function MainLoop(timestamp) {
    // Throttle the frame rate.    
    if (timestamp < lastFrameTimeMs + (1000 / maxFPS)) {
        requestAnimationFrame(MainLoop);
        return;
    }
    if (timestamp > lastFpsUpdate + 1000) { // update every second
        fps = 0.25 * framesThisSecond + (1 - 0.25) * fps; // compute the new FPS
 
        lastFpsUpdate = timestamp;
        framesThisSecond = 0;
    }
    framesThisSecond++;

    delta = timestamp - lastFrameTimeMs; // get the delta time since last frame
    lastFrameTimeMs = timestamp;

    // Simulate the total elapsed time in fixed-size chunks
    while (delta >= timestep) {
        UpdateLoop(timestep);
        delta -= timestep;
    }

    // UpdateLoop(delta);
    DrawLoop();
    requestAnimationFrame(MainLoop);
}

function SpawnPlayerIsIn() {
    if(ship.pos.x<canvasWidth/2){
        if(ship.pos.y<canvasHeight/2){
            return 0;
        }else{
            return 1;
        }
    }else{
        if(ship.pos.y<canvasHeight/2){
            return 2;
        }else{
            return 3;
        }
    }
}

function UpdateLoop(delta) {
    timeSinceStart+=delta;
    timeSinceLastCubeSpawn+=delta;
    timeSinceLastGateSpawn+=delta;
    timeSinceEnteredGate+=delta;

    gamepads = navigator.getGamepads();
    if(!gamePlaying && ((gamepads.length>0 && gamepads[0].buttons[0].pressed) || keys[32] || keys[10])){
        gamePlaying = true;
        ship.visible = true;
        lives = 1;
        multiplier = 1;
        score = 0;
        spawnCount = 4;
        spawnCountIncrement = 0;
        gateMultiplier=1;
        newHighScore = false;
        let spawnSFX = new Audio("Audio/MySFX/Player_Spawn.wav");
        spawnSFX.loop = false; 
        if(!muted) spawnSFX.play();
    }

    if(timeSinceLastCubeSpawn>500){
        timeSinceLastCubeSpawn = 0;
        var numOfRows = Math.ceil(Math.sqrt(spawnCount));
        var randNum;
        do{
            randNum = Math.floor(Math.random()*4);
        }while(randNum==SpawnPlayerIsIn());

        if(randNum==0){
            for(let x = 0; x<numOfRows; x++){
                for(let y = 0; y<numOfRows && ((x*numOfRows)+y)<spawnCount; y++){            
                    asteroids.push(new Asteroid(new Vector2(50+(x*40), 50+(y*40))));
                }
            }
        }else if(randNum==1){
            for(let x = 0; x<numOfRows; x++){
                for(let y = 0; y<numOfRows && ((x*numOfRows)+y)<spawnCount; y++){            
                    asteroids.push(new Asteroid(new Vector2(50+(x*40), canvasHeight-50-(y*40))));
                }
            }
        }else if(randNum==2){
            for(let x = 0; x<numOfRows; x++){
                for(let y = 0; y<numOfRows && ((x*numOfRows)+y)<spawnCount; y++){          
                    asteroids.push(new Asteroid(new Vector2(canvasWidth-50-(x*40), 50+(y*40))));
                }
            }
        }else{
            for(let x = 0; x<numOfRows; x++){
                for(let y = 0; y<numOfRows && ((x*numOfRows)+y)<spawnCount; y++){
                    asteroids.push(new Asteroid(new Vector2(canvasWidth-50-(x*40), canvasHeight-50-(y*40))));    
                }            
            }
        }
        spawnCountIncrement++;
        if(spawnCountIncrement>3){
            spawnCountIncrement=0;
            spawnCount++;
        }
    }
    
    // Check for collision of ship with asteroid
    if (asteroids.length !== 0) {
        for(let k = 0; k < asteroids.length; k++){
            if(CircleCollision(ship.pos.x, ship.pos.y, 1, asteroids[k].pos.x, asteroids[k].pos.y, asteroids[k].collisionRadius)){
                ship.Died();
            }
        }
    }

//     // Check for collision with bullet and asteroid
//     if (asteroids.length !== 0 && bullets.length != 0){
// loop1:
//         for(let l = 0; l < asteroids.length; l++){
//             for(let m = 0; m < bullets.length; m++){
//                 if(CircleCollision(bullets[m].pos.x, bullets[m].pos.y, 3, asteroids[l].pos.x, asteroids[l].pos.y, asteroids[l].collisionRadius)){
//                     // Check if asteroid can be broken into smaller pieces
//                     if(asteroids[l].level === 1){
//                         // asteroids.push(new Asteroid(asteroids[l].x - 5, asteroids[l].y - 5, 25, 2, 22));
//                         // asteroids.push(new Asteroid(asteroids[l].x + 5, asteroids[l].y + 5, 25, 2, 22));
//                     } else if(asteroids[l].level === 2){
//                         // asteroids.push(new Asteroid(asteroids[l].x - 5, asteroids[l].y - 5, 15, 3, 12));
//                         // asteroids.push(new Asteroid(asteroids[l].x + 5, asteroids[l].y + 5, 15, 3, 12));
//                     }
//                     asteroids.splice(l,1);
//                     bullets.splice(m,1);
//                     score += 20;
 
//                     // Used to break out of loops because splicing arrays
//                     // you are looping through will break otherwise
//                     break loop1;
//                 }
//             }
//         }
//     }
 
    if(ship.visible){
        ship.Update(delta);
    }
    
    if (bullets.length !== 0) {
        for(let i = 0; i < bullets.length; i++){
            bullets[i].Update(delta);
        }
    }
    // Check for collision of each asteroid with other asteroids
    if (asteroids.length !== 0) {
        cubesSpatialHash = new SpatialHashMap(CUBE_CELL_SIZE);
        for(let k = 0; k < asteroids.length; k++){
            cubesSpatialHash.add(asteroids[k]);
            asteroids[k].UpdateDirections();
        }
    }

    if (asteroids.length !== 0) {
        for(let j = 0; j < asteroids.length; j++){
            asteroids[j].Update(delta);
        }
    }

    if(timeSinceLastGateSpawn>1000){
        timeSinceLastGateSpawn=0;  
        gates.push(new Gate());
    }
 
    if (gates.length !== 0) {
        for(let j = 0; j < gates.length; j++){
            gates[j].Update(delta);
            if(!gates[j].exploded && gates[j].Intersects(ship)){
                gates[j].Explode(j);
            }
            if(gates[j].readyToDestroy){           
                gates.splice(j,1);
                if(!muted){
                    let RingEnemyExplodeSFX = new Audio("Audio/MySFX/RingEnemyExplode.wav");
                    RingEnemyExplodeSFX.loop = false;
                    RingEnemyExplodeSFX.play();
                } 
                j--;
            }
        }
    }
    if (geoms.length !== 0) {
        for(let j = 0; j < geoms.length; j++){
            geoms[j].Update(delta);
            if(geoms[j].destroyed){
                geoms.splice(j,1);
                j--;
            }
        }
    }
    if (particles.length !== 0) {
        for(let j = 0; j < particles.length; j++){
            particles[j].Update(delta);
            if(particles[j].destroyed){
                particles.splice(j,1);
                j--;
            }
        }
    }
    if(score>highScore){
        let winSFX = new Audio("Audio/MySFX/winSFX.wav");
        winSFX.loop = false; 
        if(!muted && !newHighScore) winSFX.play();
        newHighScore = true;
        highScore=score;
    }
    localStorage.setItem(localStorageName, highScore);
}

function clamp(value, min, max){
    if(value < min) return min;
    else if(value > max) return max;
    return value;
}

function DrawBox(w,h,color) {
    ctx.beginPath();

    ctx.lineTo(0-w, 0-h);
    ctx.lineTo(-w, canvasHeight+h);
    ctx.lineTo(canvasWidth+w, canvasHeight+h);
    ctx.lineTo(canvasWidth+w, -h);
    ctx.strokeStyle = color;
    ctx.lineWidth= 3;

    ctx.closePath();
    ctx.stroke();
}

function DrawLoop() {
    ctx.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // how much we must move the context so it will be center-aligned to the player's position
    const camX = -ship.pos.x + canvas.width / 2;
    const camY = -ship.pos.y + canvas.height / 2;

    ctx.translate( camX, camY );    

    // Display score
    ctx.fillStyle = 'white';
    ctx.font = '21px Arial';
    ctx.fillText("SCORE : " + score.toString(), 20-camX, 65-camY);
    ctx.fillText("FPS : " + Math.round(fps), ship.pos.x+(canvasWidth / 2)-100, 35-camY);
    ctx.fillText("x" + multiplier, ship.pos.x, 35-camY);
 
    // If no lives signal game over
    if(lives <= 0){
        if(!muted && gamePlaying) {
            let gameOverSFX = new Audio("Audio/MySFX/GameOverSound.wav");
            gameOverSFX.loop = false;    
            gameOverSFX.play();
        }
        gamePlaying=false;
        ship.visible = false;
        ctx.fillStyle = 'white';
        ctx.font = '50px Arial';
        ctx.fillText("GAME OVER", canvasWidth / 2 - 150, canvasHeight / 2);
        asteroids = [];
        gates = [];
        geoms = [];
        particles = [];
        CreateWax(5,5);
    }

    // Draw life ships
    // DrawLifeShips();

    for(let y = 0; y<starCount; y++){          
        stars[y].Draw();
    }

    if(ship.visible){
        ship.Draw();
    }
    if (bullets.length !== 0) {
        for(let i = 0; i < bullets.length; i++){
            bullets[i].Draw();
        }
    }
    if (asteroids.length !== 0) {
        for(let j = 0; j < asteroids.length; j++){
            asteroids[j].Draw(j);
        }
    }
    if (gates.length !== 0) {
        for(let g = 0; g < gates.length; g++){
            gates[g].Draw();
        }
    }
    if (geoms.length !== 0) {
        for(let g = 0; g < geoms.length; g++){
            geoms[g].Draw();
        }
    }
    if (particles.length !== 0) {
        for(let p = 0; p < particles.length; p++){
            particles[p].Draw();
        }
    }
    
    ctx.fillStyle = 'white';
    ctx.font = '21px Arial';
    ctx.fillText("HIGH SCORE : " + highScore.toString(), 20-camX, 35-camY);

    // DrawBox(-20,-20,"#FF0000");
    // DrawBox(-10,-10,"#FF0000");

    DrawBox(0,0,"#0088FF");
    DrawBox(10,10,"#0088FF");

    for(let y = 0; y<wax.length; y++){          
        wax[y].Draw();
    }
    // DrawBox(20,20,"#00FF00");
    // DrawBox(30,30,"#00FF00");
}

