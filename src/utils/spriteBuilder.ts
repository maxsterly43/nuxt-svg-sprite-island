import { existsSync, readFileSync } from "node:fs";
import SVGSpriter from "svg-sprite";
import { getFilesRecursive } from "./helpers";

export const buildSprite = ({
  spriteName,
  dirIcons,
  svgo,
}: {
  spriteName: string;
  dirIcons: string;
  svgo: {};
}): string => {
  const spriter = new SVGSpriter({
    shape: {
      id: {
        generator: function (fileName) {
          const [name] = fileName.split(".");
          return [spriteName, name].join("-");
        },
      },
    },
    mode: {
      symbol: {
        // @ts-ignore
        inline: true,
      },
    },
  });

  if (!existsSync(dirIcons)) return "";

  const files = getFilesRecursive(dirIcons);

  for (const filePath of files) {
    spriter.add(filePath, null, readFileSync(filePath, "utf-8"));
  }

  let svgSpriteContent = "";

  spriter.compile((error, result, data) => {
    svgSpriteContent = result.symbol.sprite.contents.toString();
  });

  return svgSpriteContent;
};
