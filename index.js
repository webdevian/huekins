const Huejay = require('huejay')
require('dotenv').config()
const { env } = process

process.on('unhandledRejection', error => {
  console.error(error.message)
  process.exit()
})

class HueKins {
  constructor () {
    this.hue = new Huejay.Client({
      host: env.HUE_HOST,
      port: env.HUE_PORT || 80,
      username: env.HUE_USERNAME,
      timeout: env.HUE_TIMEOUT || 15000
    })

    this.jenkins = require('jenkins')({ baseUrl: env.JENKINS_URL, promisify: true })

    this.jobNames = env.JENKINS_JOBS.split(',')
  }

  async init () {
    await this.getInfo()
  }

  async getInfo () {
    const bridge = await this.hue.bridge.get()
    console.info(`Retrieved bridge ${bridge.name}`)
    console.info('  Id:', bridge.id)
    console.info('  Model Id:', bridge.modelId)
    console.info('  Model Name:', bridge.model.name)

    this.bridge = bridge

    const lights = await this.hue.lights.getAll()
    console.info('Lights connected:')

    lights.map(light => {
      console.info(`  - ${light.attributes.attributes.name}`)
    })

    try {
      this.activeLight = lights.filter(light => light.attributes.attributes.name === env.LIGHT_NAME)[0]
    } catch (e) {
      throw new Error(`Cannot connect to selected light - ${env.LIGHT_NAME}`)
    }

    this.lights = lights
  }

  flashLight () {
    this.activeLight.alert = 'lselect'
  }

  async failingLight () {
    this.flashLight()
    this.activeLight.hue = 0
    await this.hue.lights.save(this.activeLight)
  }

  async unstableLight () {
    this.flashLight()
    this.activeLight.hue = 25500 / 2
    await this.hue.lights.save(this.activeLight)
  }

  async passingLight () {
    this.activeLight.hue = 25500
    await this.hue.lights.save(this.activeLight)
  }

  async buildingLight () {
    this.flashLight()
    this.activeLight.hue = 46920
    await this.hue.lights.save(this.activeLight)
  }

  async getStatus () {
    let building = false
    let unstable = false
    let failing = false

    await Promise.all(this.jobNames.map(async jobName => {
      const job = await this.jenkins.job.get(jobName)
      const lastBuild = await this.jenkins.build.get(jobName, job.lastBuild.number)

      if (lastBuild.result === 'FAILURE') {
        failing = true
      }

      if (lastBuild.result === 'UNSTABLE' || lastBuild.result === 'ABORTED') {
        unstable = true
      }

      if (!lastBuild.result) {
        building = true
      }

      return lastBuild.result
    }))

    if (building) {
      return 'building'
    }

    if (failing) {
      return 'failing'
    }

    if (unstable) {
      return 'unstable'
    }

    return 'passing'
  }

  async setStatus () {
    const newStatus = await this.getStatus()
    if (this.status !== newStatus) {
      console.info(`Status has changed to ${newStatus}`)
      this.status = newStatus
      await this.setLight(newStatus)
    } else {
      return false
    }
  }

  async setLight (status) {
    await this[`${status}Light`]()
  }

  async startListener () {
    await this.setStatus()
    setInterval(await this.setStatus.bind(this), 2000)
  }
}

const start = async () => {
  const hue = new HueKins()
  await hue.init()
  await hue.startListener()
}

module.exports = start()
