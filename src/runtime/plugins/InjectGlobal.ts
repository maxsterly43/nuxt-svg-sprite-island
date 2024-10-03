/* eslint-disable */
// @ts-nocheck
import { defineNitroPlugin, useStorage } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', async (html) => {
    const globalSprite = await useStorage('assets:server').getItem<string>(
      'sprites/global.html',
    )
    html.bodyAppend.push(globalSprite)
  })
})
