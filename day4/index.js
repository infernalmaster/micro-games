const canvas = document.getElementById('app')

const soundCtx = new window.AudioContext()
function bah () {
  const osc = soundCtx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 140
  osc.connect(soundCtx.destination)
  osc.start()
  osc.stop(soundCtx.currentTime + 0.1)
}

function isCollision (entity1, entity2) {
  return (
    entity1.alive &&
    entity2.alive &&
    entity1.position.distance(entity2.position) <
      entity1.radius + entity2.radius
  )
}
const world = {
  isGameOver: false,
  width: 300,
  height: 300,
  asteroids: [],
  bullets: [],
  player: null,
  score: null,
  spawnAsteroid: function () {},
  update: function () {
    this.bullets = this.bullets.filter(b => b.alive)
    this.asteroids = this.asteroids.filter(a => a.alive)

    this.bullets.forEach(b => {
      this.asteroids.forEach(a => {
        if (isCollision(a, b)) {
          b.alive = false
          a.alive = false
          this.score.inc()
          this.spawnAsteroid()
          bah()
        }
      })
    })

    this.asteroids.forEach(a => {
      if (isCollision(a, this.player)) {
        a.alive = false
        this.player.alive = false
        this.isGameOver = true
        setTimeout(() => {
          this.reset()
        }, 1000)
      }
    })

    this.asteroids.forEach(a => a.update())
    this.bullets.forEach(b => b.update())
    !this.isGameOver && this.player.update()
  },
  reset: function () {
    this.isGameOver = false
    this.score.reset()

    this.player = new Player(new Vec2(150, 150), new Vec2(0, 0), 5)
    this.asteroids = []
    this.bullets = []
    new Array(7).fill(0).forEach(x => world.spawnAsteroid())
  },
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  draw: function (ctx) {
    this.asteroids.forEach(a => a.draw())
    this.player.draw()
    this.score.draw()

    this.isGameOver && ctx.fillText('Game Over', 50, 100)

    this.bullets.forEach(a => a.draw())
  }
}
canvas.width = world.width
canvas.height = world.height
canvas.style.width = '150px'
canvas.style.height = '150px'

/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext('2d')
ctx.font = '40px Arial'

// ctx.translate(300, 300)
// ctx.rotate(Math.PI)

class Vec2 {
  constructor (x, y) {
    this.x = x
    this.y = y
  }

  static fromAngleAndLength (angle, length) {
    const v = new Vec2(0, 0)
    v.x = -length * Math.sin(angle)
    v.y = length * Math.cos(angle)
    return v
  }

  /**
   *
   * @param {Vec2} vec
   */
  distance (vec) {
    return Math.sqrt((this.x - vec.x) ** 2 + (this.y - vec.y) ** 2)
  }

  /**
   *
   * @param {Vec2} vec
   */
  add (vec) {
    this.x += vec.x
    this.y += vec.y
    return this
  }

  /**
   *
   * @param {Vec2} vec
   */
  multVec (vec) {
    this.x *= vec.x
    this.y *= vec.y
    return this
  }

  /**
   *
   * @param {Number} number
   */
  scale (number) {
    this.x *= number
    this.y *= number
    return this
  }

  clone () {
    return new Vec2(this.x, this.y)
  }

  get length () {
    return Math.sqrt(this.x ** 2 + this.y ** 2)
  }

  setLength (val) {
    let k = this.length / val
    this.x /= k
    this.y /= k
    return this
  }
}

const keys = new Set()
document.addEventListener('keydown', e => {
  keys.add(e.key)
})
document.addEventListener('keyup', e => {
  keys.delete(e.key)
})

class Entity {
  /**
   *
   * @param {Vec2} position
   * @param {Vec2} speed
   * @param {Number} radius
   */
  constructor (position, speed, radius) {
    this.position = position
    this.speed = speed
    this.radius = radius
    this.alive = true
  }

  update () {
    this.position.add(this.speed)
    this.position.x = (this.position.x + world.width) % world.width
    this.position.y = (this.position.y + world.height) % world.height
  }

  draw () {
    ctx.beginPath()
    ctx.ellipse(
      this.position.x,
      this.position.y,
      this.radius,
      this.radius,
      0,
      0,
      Math.PI * 2
    )
    ctx.strokeStyle = 'black'
    ctx.stroke()
  }
}

class Bullet extends Entity {
  update () {
    this.position.add(this.speed)
    if (
      this.position.x < 0 ||
      this.position.x > world.width ||
      this.position.y < 0 ||
      this.position.y > world.height
    ) {
      this.alive = false
    }
  }

  draw () {
    ctx.beginPath()
    ctx.ellipse(
      this.position.x,
      this.position.y,
      this.radius,
      this.radius,
      0,
      0,
      Math.PI * 2
    )
    ctx.fillStyle = 'red'
    ctx.fill()
  }
}

class Player extends Entity {
  constructor (position, speed, radius) {
    super(position, speed, radius)
    this.angle = Math.PI / 8
    this.acceleration = 0.2
    this.accelerationAngular = Math.PI / 90
    this.friction = 0.99
    this.maxSpeed = 1.5
    this.lastBulletTime = new Date()
  }

  update () {
    if (keys.has('w') || keys.has('ArrowUp')) {
      this.speed.add(Vec2.fromAngleAndLength(this.angle, this.acceleration))
    }
    if (keys.has('a') || keys.has('ArrowLeft')) {
      this.angle -= this.accelerationAngular
    }
    if (keys.has('d') || keys.has('ArrowRight')) {
      this.angle += this.accelerationAngular
    }

    if (keys.has('s') || keys.has(' ') || keys.has('ArrowDown')) {
      const currentTime = new Date()
      if (currentTime - this.lastBulletTime > 100) {
        this.lastBulletTime = currentTime
        const speed = Vec2.fromAngleAndLength(this.angle, 4).add(this.speed)
        world.bullets.push(new Bullet(this.position.clone(), speed, 3))
      }
    }

    this.speed.scale(this.friction)
    if (this.speed.length > this.maxSpeed) {
      this.speed.setLength(this.maxSpeed)
    }

    Entity.prototype.update.call(this)
  }

  draw () {
    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(this.angle)
    ctx.beginPath()
    ctx.moveTo(0, 10)
    ctx.lineTo(5, -5)
    ctx.lineTo(-5, -5)
    ctx.lineTo(0, 10)
    ctx.stroke()
    ctx.restore()
  }
}

const score = {
  data: 0,
  draw: function () {
    ctx.fillStyle = 'black'
    ctx.fillText(`${this.data}`, 10, 40)
  },
  inc: function () {
    this.data++
  },
  reset: function () {
    this.data = 0
  }
}
world.score = score

const rnd = (min, max) => min + Math.random() * (max - min)

world.spawnAsteroid = function () {
  world.asteroids.push(
    new Entity(
      Vec2.fromAngleAndLength(rnd(0, 2 * Math.PI), rnd(130, 170)).add(
        this.player.position.clone()
      ),
      new Vec2(rnd(-1, 1), rnd(-1, 1)),
      rnd(8, 20)
    )
  )
}

world.reset()

function loop () {
  requestAnimationFrame(loop)
  ctx.clearRect(0, 0, world.width, world.height)

  world.update()
  world.draw(ctx)
}

requestAnimationFrame(loop)
