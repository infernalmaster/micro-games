const canvas = document.getElementById('app')

const world = {
  isGameOver: false,
  width: 300,
  height: 300
}
canvas.width = world.width
canvas.height = world.height
canvas.style.width = '150px'
canvas.style.height = '150px'

const soundCtx = new (window.AudioContext || window.webkitAudioContext)()

function jumpSound () {
  const osc = soundCtx.createOscillator()
  // osc.type = 'sawtooth'
  osc.frequency.value = 440
  osc.connect(soundCtx.destination)
  osc.start()
  osc.stop(soundCtx.currentTime + 0.1)
}

/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext('2d')
ctx.font = '40px Arial'

ctx.translate(0, world.height)
ctx.scale(1, -1)

function isCollideBoxes (player, platform) {
  return (
    ((player.position.x < platform.position.x &&
      player.position.x + player.width > platform.position.x) ||
      (player.position.x > platform.position.x &&
        player.position.x < platform.position.x + platform.width)) &&
    ((player.position.y < platform.position.y &&
      player.position.y + player.height > platform.position.y) ||
      (player.position.y > platform.position.y &&
        player.position.y < platform.position.y + platform.height))
  )
}

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

class Player {
  /**
   *
   * @param {Vec2} position
   * @param {Vec2} speed
   */
  constructor (position, speed) {
    this.position = position
    this.speed = speed
    this.width = 20
    this.height = 20
  }

  update (platforms) {
    this.speed.x = 0

    if (keys.has('a') || keys.has('ArrowLeft')) {
      this.speed.x = -4
    }
    if (keys.has('d') || keys.has('ArrowRight')) {
      this.speed.x = 4
    }

    this.speed.y -= 0.2 // gravity
    const prevY = this.position.y
    this.position.add(this.speed)

    const collidedPlatform = platforms.find(platform =>
      isCollideBoxes(this, platform)
    )

    if (this.speed.y <= 0) {
      if (
        collidedPlatform &&
        prevY >= collidedPlatform.position.y + collidedPlatform.height
      ) {
        this.speed.y = 0
        this.position.y = collidedPlatform.position.y + collidedPlatform.height
      }
    }

    if (
      collidedPlatform &&
      (keys.has('w') || keys.has('ArrowUp') || keys.has(' '))
    ) {
      this.speed.y = 6
      jumpSound()
    }

    if (this.position.x < 0) {
      this.position.x = 0
    } else if (this.position.x + this.width > world.width) {
      this.position.x = world.width - this.width
    }
  }

  draw () {
    ctx.fillStyle = 'red'
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
  }
}

class Camera {
  /**
   *
   * @param {Vec2} position
   */
  constructor (position) {
    this.position = position
    this.playerMaxY = world.height / 2
  }
  update (player) {
    this.position.y += 1

    if (this.position.y < player.position.y - this.playerMaxY) {
      this.position.y = player.position.y - this.playerMaxY
    }
  }
}

class Platform {
  /**
   *
   * @param {Vec2} position
   * @param {Number} width
   */
  constructor (position, width) {
    this.position = position
    this.width = width
    this.height = 10
  }
  draw () {
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
  }
}

class PlatformManager {
  /**
   *
   * @param {Camera} camera
   */
  constructor (camera) {
    this.camera = camera
    /**
     * @name PlatformManager#platforms
     * @type Platform[]
     */
    this.platforms = []
  }

  update () {
    this.platforms = this.platforms.filter(
      p => p.position.y > camera.position.y
    )
    while (this.platforms.length < 20) {
      const lastPlatform = this.platforms[this.platforms.length - 1]
      const position = new Vec2(
        rnd(0, 250),
        lastPlatform.position.y + rnd(30, 60)
      )
      const platform = new Platform(position, rnd(50, 100))
      this.platforms.push(platform)
    }
  }

  draw () {
    ctx.fillStyle = 'black'
    this.platforms.forEach(p => p.draw())
  }
}

let camera = new Camera(new Vec2(0, 0))
let platformManager = new PlatformManager(camera)
platformManager.platforms.push(new Platform(new Vec2(100, 200), 100))
let player = new Player(new Vec2(150, 220), new Vec2(0, 0))

const rnd = (min, max) => min + Math.random() * (max - min)

function loop () {
  requestAnimationFrame(loop)
  ctx.clearRect(0, 0, world.width, world.height)

  if (player.position.y > camera.position.y) {
    camera.update(player)
  } else {
    world.isGameOver = true
  }
  platformManager.update()
  player.update(platformManager.platforms)

  ctx.save()
  ctx.translate(camera.position.x, -camera.position.y)
  platformManager.draw()
  player.draw()

  ctx.restore()

  ctx.save()
  ctx.translate(0, world.height)
  ctx.scale(1, -1)
  ctx.fillStyle = 'black'
  ctx.fillText(`${Math.floor(camera.position.y / 10)}`, 10, 40)
  if (world.isGameOver) ctx.fillText('Game Over', 50, 120)
  ctx.restore()
}

requestAnimationFrame(loop)
