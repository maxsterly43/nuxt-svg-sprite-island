import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

export const getFilesRecursive = (
  dir: string,
  files: string[] = []
): string[] => {
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

export const getDirectories = (path: string) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
    : [];

export const capitalized = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);
