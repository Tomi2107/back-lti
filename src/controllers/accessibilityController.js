import { prisma } from '../lib/prisma.js'

const DEFAULT_SETTINGS = {

  contrast_mode: false,
  dark_mode: false,

  font_family: 'default',
  font_size: 'normal',
  alignment: 'left',

  brightness: 50,
  contrast: 50,
  saturation: 50,

  grayscale: false,

  voice: false,
  voice_speed: 50,
  voice_volume: 100,

  button_position: 'right',

  profile: null

}