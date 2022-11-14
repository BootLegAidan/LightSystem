let c = document.getElementById('canvas')
let ctx = c.getContext('2d')
let marchC = document.getElementById('march')
let displayWidth = 1000
let lightScale = 1 // Resoultion scale of the lighting


let vmin = Math.min(c.height,c.width)/100
let center = [c.width / 2, c.height / 2]

class Marcher {
  constructor (options) {
    // Set up config
    this.c = options.canvas // Canvas element to draw the light on
    this.org ={ // Origin of the light
      x: (options.x || 0),
      y: (options.y || 0)
    }
    this.seg = (options.segments || 10) // Number of rays to send out
    this.col = (options.rgb || [255,255,255])  // RGB array for the color of the light
    this.dist = (options.distance || 100)  // How far the light spreads
    this.sub = (options.substeps || 10) // How many times it checkhs for collision per step
    this.fade = (options.fadeOut || true) // Enable "accurate" lighting
    this.debug = (options.debug || false) // Enable showing light contact points

    // Set up other important stuff
    this.ctx = this.c.getContext('2d')
    this.rays = new Array(this.seg)
    this.rays.fill({nat: true})
    // this.endPts = new Array(this.seg)
    this.steps = 0
    this.busy = false
  }
  march (force = false) {
    if (this.steps < this.sub && (!this.busy || force)) {
      this.busy = true  // Mark the light rendering as "busy", so that it cannot be called prematurely
      this.ctx.beginPath()
      for (let i = 0; i < this.seg; i++){
        if (this.rays[i].nat) { // Check if this segment has ended early (if it encountered an object already)
          let x = this.org.x + (Math.sin(((Math.PI * 2) / this.seg) * i) * (this.steps/this.sub) * this.dist) // Set the x coord of the search
          let y = this.org.y + (Math.cos(((Math.PI * 2) / this.seg) * i) * (this.steps/this.sub) * this.dist) // Set the y coord of the search

          this.rays[i] = {x: x, y: y, nat: true}
          if (ctx.getImageData(x,y,1,1).data[3] != 0) { // Check if the external canvas has an object at (x, y)
            this.rays[i].nat = false // If it does, mark that the segment ended unnaturally and that there is an object at (x, y)
          }
        }

        let adjustedX = this.rays[i].x*lightScale // Scale the position to account for the scale
        let adjustedY = this.rays[i].y*lightScale
        if (i == 0) {
          this.ctx.moveTo(Math.floor(adjustedX*lightScale),Math.floor(adjustedY))
        } else {
          this.ctx.lineTo(Math.floor(adjustedX),Math.floor(adjustedY))
        }
        if (this.debug && !this.rays[i].nat) { // Shows the points where a ray stopped unnaturally
          this.ctx.fillStyle = 'red'
          this.ctx.fillRect(this.rays[i].x-0.5,this.rays[i].y-0.5,1,1)
        }
      }
      if (this.fade) { // If the lighting is "realistic"
        this.ctx.fillStyle = `rgba(${this.col[0]},${this.col[1]},${this.col[2]},${(1-(1/(this.sub/(1+this.steps))))})`
      } else {
        this.ctx.fillStyle = `rgb(${this.col[0]},${this.col[1]},${this.col[2]})`
      }
      this.ctx.fill()
      this.steps ++
      this.march(true) // Iterate and bypass the "busy" check
    } else if (this.steps >= this.sub){ // reset the rays and steps, then mark as not busy
      this.steps = 0
      this.rays.fill({nat: true})
      this.busy = false
    }
  }
}


addEventListener('resize',resize)

let test = new Marcher({
  x: 10,
  y: 10,
  canvas: marchC,
  fadeOut: true,
  segments: 64,
  distance: 500,
  substeps: 40,
  rgb: [200,200,200],
  debug: false
})
function resize () {
  dpr = window.devicePixelRatio;
  let rect = c.getBoundingClientRect();
  c.width = displayWidth;
  c.height = displayWidth*(window.innerHeight/window.innerWidth);
  marchC.width = displayWidth *lightScale;
  marchC.height = displayWidth*(window.innerHeight/window.innerWidth)*lightScale;
  vmin = Math.min(c.height,c.width)/100
  center = [c.width / 2, c.height / 2]
  test.org.x = center[0]
  test.org.y = center[1]
  test.dist = 72 * vmin
  draw()
}
function clear() {
  test.ctx.clearRect(0,0,c.width,c.height)
  ctx.clearRect(0,0,c.width,c.height)
}
function draw() {
    test.march()
}
resize()
function mouseMoved(e) {
  document.body.style.cursor = 'none';
  clear()
  let obj = new Image()
  obj.src = './images/mouse.png'
  ctx.drawImage(obj,e.clientX*(c.width/parseInt(getComputedStyle(c).width)),e.clientY*(c.height/parseInt(getComputedStyle(c).height)),10,15)
  draw()
}
addEventListener('mousemove',mouseMoved)
