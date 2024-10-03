import { resolve } from 'node:path'
import {
  addComponent,
  addComponentsDir,
  addServerPlugin,
  addTemplate,
  createResolver,
  defineNuxtModule,
  resolveAlias,
} from '@nuxt/kit'
import { defu } from 'defu'

import { buildSprite, capitalized, getDirectories } from './utils'

export interface ModuleOptions {
  dirIcons: string
  htmlRenderGlobal: boolean
  injectPublicAssets: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'svg-sprite-island',
    configKey: 'svgSpriteIsland',
  },
  defaults: {
    dirIcons: '~/icons',
    htmlRenderGlobal: true,
    injectPublicAssets: false,
  },
  async setup(_options, _nuxt) {
    const nuxtOptions = _nuxt.options

    const dirIcons = resolveAlias(_options.dirIcons, nuxtOptions.alias)

    nuxtOptions.experimental = defu(nuxtOptions.experimental, {
      componentIslands: true,
    })

    const { resolve: resolverModule } = createResolver(import.meta.url)

    const dirSprites = getDirectories(dirIcons)

    const spriteComponentTemplate = (svgSprite: string) =>
      `<template>${svgSprite}</template><script setup></script>`

    for (const dir of dirSprites) {
      console.log(resolve(dirIcons, dir))
      const inlineSprite = buildSprite({
        spriteName: dir,
        dirIcons: resolve(dirIcons, dir),
      })

      if (dir === 'global' && _options.htmlRenderGlobal) {
        await addTemplate({
          dst: resolveAlias(
            '~~/server/assets/sprites/global.html',
            nuxtOptions.alias,
          ),
          filename: 'global.html',
          getContents: () => inlineSprite,
          write: true,
        })
      }

      const fileName = `${capitalized(dir)}Sprite.vue`
      await addTemplate({
        dst: resolverModule(`./runtime/components/sprites/${fileName}`),
        filename: fileName,
        getContents: () => spriteComponentTemplate(inlineSprite),
        write: true,
      })

      if (_options.injectPublicAssets) {
        await addTemplate({
          dst: resolverModule(`./runtime/sprites/${dir}.svg`),
          filename: `${dir}.svg`,
          getContents: () => inlineSprite,
          write: true,
        })
      }
    }

    await addComponentsDir({
      path: resolverModule('./runtime/components/sprites'),
      island: true,
      global: true,
    })

    await addComponent({
      name: 'SvgIcon',
      filePath: resolverModule('./runtime/components/SvgIcon.vue'),
      global: true,
    })

    if (_options.injectPublicAssets) {
      _nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.publicAssets ||= []
        nitroConfig.publicAssets.push({
          dir: resolverModule('./runtime/sprites'),
          baseURL: '/sprites',
          maxAge: 0,
        })
      })
    }

    if (_options.htmlRenderGlobal) {
      addServerPlugin(resolverModule('./runtime/plugins/injectGlobal.ts'))
    }
  },
})
