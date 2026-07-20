import path from "path";
import fs from "fs";
import { globSync } from "glob";
import { nodeFileTrace } from "@vercel/nft";

import FileHelper from "@/helpers/FileHelper";

import { BundlerConfiguration, Rule } from "@/types";
export default class Bundler {
  protected configuration: BundlerConfiguration;

  constructor(configuration: BundlerConfiguration) {
    this.configuration = {
      ...configuration,
      outRoot: path.resolve(configuration.outRoot),
      srcRoot: path.resolve(configuration.srcRoot),
    };
  }

  protected getSrcPath(...paths: Array<string>) {
    return path.join(this.configuration.srcRoot, ...paths);
  }

  protected getDestPath(...paths: Array<string>) {
    return path.join(this.configuration.outRoot, ...paths);
  }

  protected async handleStaticRule(rule: Rule) {
    const ruleSrcPath = this.getSrcPath(rule.src);
    const stats = fs.statSync(ruleSrcPath);

    if (stats.isFile()) {
      const destPath = this.getDestPath(rule.src);
      FileHelper.copyFile({
        srcPath: ruleSrcPath,
        destPath,
        pathFilter: rule.pathFilter,
        rewritePath: rule.rewritePath,
      });
      return;
    }

    const fileEntries = globSync("**/*", {
      cwd: ruleSrcPath,
      nodir: true,
    });

    for (const fileEntry of fileEntries) {
      const srcPath = this.getSrcPath(rule.src, fileEntry);
      const destPath = this.getDestPath(rule.src, fileEntry);
      FileHelper.copyFile({
        srcPath,
        destPath,
        pathFilter: rule.pathFilter,
        rewritePath: rule.rewritePath,
      });
    }
  }

  protected async handleBundleRule(rule: Rule) {
    const fileEntries: string[] = [];
    const srcPath = this.getSrcPath(rule.src);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      const files = globSync("**/*.js", { cwd: srcPath });
      fileEntries.push(...files);
    } else if (stat.isFile()) {
      if (path.extname(srcPath) !== ".js") {
        throw new Error(
          `Only .js files are supported as entry points. Invalid file: ${srcPath}`,
        );
      }
      fileEntries.push(rule.src);
    }

    const { fileList: dependentPaths } = await nodeFileTrace(
      fileEntries.map((f) => this.getSrcPath(f)),
      {
        base: this.configuration.srcRoot,
      },
    );

    for (const dependentPath of dependentPaths) {
      const srcPath = this.getSrcPath(dependentPath);
      const destPath = this.getDestPath(dependentPath);

      if (
        FileHelper.isSymbolicLink(srcPath) ||
        FileHelper.isDirectory(srcPath)
      ) {
        const realPath = FileHelper.getRealPath(srcPath);
        const files = FileHelper.readDirectory(realPath);

        for (const file of files) {
          const srcPath = path.join(realPath, file);
          const destPath = this.getDestPath(dependentPath, file);
          FileHelper.copyFile({
            srcPath,
            destPath,
            pathFilter: rule.pathFilter,
            rewritePath: rule.rewritePath,
          });
        }
      } else {
        FileHelper.copyFile({
          srcPath,
          destPath,
          pathFilter: rule.pathFilter,
          rewritePath: rule.rewritePath,
        });
      }
    }
  }

  public async run(): Promise<void> {
    if (this.configuration.outRoot) {
      fs.rmSync(this.configuration.outRoot, { recursive: true, force: true });
      fs.mkdirSync(this.configuration.outRoot, { recursive: true });
    }

    for (const rule of this.configuration.rules) {
      const srcPath = this.getSrcPath(rule.src);
      const isFileExists = FileHelper.isFileExists(srcPath);

      if (!isFileExists) {
        throw new Error(`Source path does not exist: ${srcPath}`);
      }

      if (rule.type === "static") {
        await this.handleStaticRule(rule);
      } else {
        await this.handleBundleRule(rule);
      }
    }
  }
}
