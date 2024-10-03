import { resolve } from 'node:path';
import { defineNuxtModule, resolveAlias, createResolver, addTemplate, addComponentsDir, addComponent, addServerPlugin } from '@nuxt/kit';
import { defu } from 'defu';
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import SVGSpriter from 'svg-sprite';

const getFilesRecursive = (dir, files = []) => {
  const fileList = readdirSync(dir);
  for (const file of fileList) {
    const name = resolve(dir, file);
    if (statSync(name).isDirectory()) {
      getFilesRecursive(name, files);
    } else {
      files.push(name);
    }
  }
  return files;
};
const getDirectories = (path) => existsSync(path) ? readdirSync(path, { withFileTypes: true }).filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name) : [];
const capitalized = (word) => word.charAt(0).toUpperCase() + word.slice(1);

const buildSprite = ({
  spriteName,
  dirIcons
}) => {
  const spriter = new SVGSpriter({
    shape: {
      id: {
        generator: function(fileName) {
          const [name] = fileName.split(".");
          return [spriteName, name].join("-");
        }
      }
    },
    mode: {
      symbol: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        inline: true
      }
    }
  });
  if (!existsSync(dirIcons))
    return "";
  const files = getFilesRecursive(dirIcons);
  for (const filePath of files) {
    spriter.add(filePath, null, readFileSync(filePath, "utf-8"));
  }
  let svgSpriteContent = "";
  spriter.compile((_, result) => {
    svgSpriteContent = result.symbol.sprite.contents.toString();
  });
  return svgSpriteContent;
};

const module = defineNuxtModule({
  meta: {
    name: "svg-sprite-island",
    configKey: "svgSpriteIsland"
  },
  defaults: {
    dirIcons: "~/icons",
    htmlRenderGlobal: true,
    injectPublicAssets: false
  },
  async setup(_options, _nuxt) {
    const nuxtOptions = _nuxt.options;
    const dirIcons = resolveAlias(_options.dirIcons, nuxtOptions.alias);
    nuxtOptions.experimental = defu(nuxtOptions.experimental, {
      componentIslands: true
    });
    const { resolve: resolverModule } = createResolver(import.meta.url);
    const dirSprites = getDirectories(dirIcons);
    const spriteComponentTemplate = (svgSprite) => `<template>${svgSprite}</template><script setup><\/script>`;
    for (const dir of dirSprites) {
      console.log(resolve(dirIcons, dir));
      const inlineSprite = buildSprite({
        spriteName: dir,
        dirIcons: resolve(dirIcons, dir)
      });
      if (dir === "global" && _options.htmlRenderGlobal) {
        await addTemplate({
          dst: resolveAlias(
            "~~/server/assets/sprites/global.html",
            nuxtOptions.alias
          ),
          filename: "global.html",
          getContents: () => inlineSprite,
          write: true
        });
      }
      const fileName = `${capitalized(dir)}Sprite.vue`;
      await addTemplate({
        dst: resolverModule(`./runtime/components/sprites/${fileName}`),
        filename: fileName,
        getContents: () => spriteComponentTemplate(inlineSprite),
        write: true
      });
      if (_options.injectPublicAssets) {
        await addTemplate({
          dst: resolverModule(`./runtime/sprites/${dir}.svg`),
          filename: `${dir}.svg`,
          getContents: () => inlineSprite,
          write: true
        });
      }
    }
    await addComponentsDir({
      path: resolverModule("./runtime/components/sprites"),
      island: true,
      global: true
    });
    await addComponent({
      name: "SvgIcon",
      filePath: resolverModule("./runtime/components/SvgIcon.vue"),
      global: true
    });
    if (_options.injectPublicAssets) {
      _nuxt.hook("nitro:config", (nitroConfig) => {
        nitroConfig.publicAssets ||= [];
        nitroConfig.publicAssets.push({
          dir: resolverModule("./runtime/sprites"),
          baseURL: "/sprites",
          maxAge: 0
        });
      });
    }
    if (_options.htmlRenderGlobal) {
      addServerPlugin(resolverModule("./runtime/plugins/injectGlobal.ts"));
    }
  }
});

export { module as default };
