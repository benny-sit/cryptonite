var canvas = document.querySelector('#lazy-rain');

canvas.height = 700;
canvas.width= $('#main-content').width();

var c = canvas.getContext('2d');

var colorArr = [
    [ 12, 92, 213],
    [ 13, 110, 253],
    [ 90, 156, 253],
    [128, 180, 255],
    [ 167, 203, 253],
]

// var mouse = {
//     x: undefined, 
//     y: undefined,
// }

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function FadingCircle(x, y, r, dy) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.minR = r;
    this.dy = dy;
    this.color = colorArr[Math.floor(Math.random() * colorArr.length)];

    this.draw = () => {
        c.beginPath();
        c.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
        c.fillStyle = `rgba(${this.color[0]},${this.color[1]},${this.color[2]}, ${1 - (this.y + this.r) / canvas.height})`;
        c.fill();
    }

    this.update = () => {
        // if( Math.abs(mouse.x - this.x) < 2 * this.minR && Math.abs(mouse.y - this.y) < 2 * this.minR) {
        //     this.r += this.r < 2 * this.minR ? 0.5 : 0;
        // } else if(this.r > this.minR) {
        //     this.r -= 0.5;
        // }


        this.y += this.dy;
        this.draw();
    }
}
var CircleArray = []
function addCircle(Carr) {
    let radius = getRandomArbitrary(7, 35);
    let x = Math.random() * (canvas.width - 2 * radius) + radius;
    let dy = getRandomArbitrary(0.25, 0.75);
    Carr.push(new FadingCircle(x, -50, radius, dy));
}

function init() {
    CircleArray = [];
    for (var i = 0; i < 15; i++) {
        addCircle(CircleArray);
    }
}


function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, innerWidth, innerHeight);
    CircleArray.map(cir => cir.update());
    CircleArray = CircleArray.filter(cir => (cir.y + cir.r)< canvas.height);
}

var ProduceSpeed = 400;
var circleProducer = setInterval(() => {
    addCircle(CircleArray);
}, ProduceSpeed);

window.addEventListener("resize", (e) => {
    canvas.width= $('#main-content').width();
    for (var i = 0; i < 10 ; i++) {
        addCircle(CircleArray);
    }
    if (window.innerWidth < 992) {
        clearInterval(circleProducer);
        ProduceSpeed = 600;
        circleProducer = setInterval(() => {
            addCircle(CircleArray);
        }, ProduceSpeed);
    } else {
        clearInterval(circleProducer);
        ProduceSpeed = 400;
        circleProducer = setInterval(() => {
            addCircle(CircleArray);
        }, ProduceSpeed);
    }
});

// canvas.addEventListener("mousemove", (e) => {
//     mouse.x = e.offsetX;
//     mouse.y = e.offsetY;
//     console.log(mouse);
// });


init();
animate();