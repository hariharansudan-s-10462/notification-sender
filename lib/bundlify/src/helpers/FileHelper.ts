import fs from "fs";
import path from "path";
import { CopyFileParams } from "@/types";

export default class FileHelper {
  public static ensureDirectoryExists(filePath: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  public static isFileExists(filePath: string) {
    return fs.existsSync(filePath);
  }

  public static isDirectory(filePath: string) {
    return fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory();
  }

  public static isSymbolicLink(filePath: string) {
    return fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink();
  }

  public static getRealPath(filePath: string) {
    if (!this.isSymbolicLink(filePath)) return filePath;
    return fs.realpathSync(filePath);
  }

  public static copyFile({
    srcPath,
    destPath,
    pathFilter,
    rewritePath,
  }: CopyFileParams) {
    if (pathFilter) {
      const proceedNext = pathFilter(srcPath);
      if (!proceedNext) return;
    }

    if (rewritePath) {
      destPath = rewritePath(destPath);
    }

    this.ensureDirectoryExists(destPath);
    fs.copyFileSync(srcPath, destPath);
  }

  public static readDirectory(
    directory: string,
    root: string = directory,
  ): string[] {
    let results: string[] = [];

    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(this.readDirectory(fullPath, root));
      } else {
        results.push(path.relative(root, fullPath));
      }
    }

    return results;
  }
}
