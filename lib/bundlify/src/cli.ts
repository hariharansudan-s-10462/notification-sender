#!/usr/bin/env node
import path from "path";
import Bundler from "./Bundler";
import fs from "fs";

(async () => {
  const args = process.argv.slice(2);
  const configPath = args[0] || "bundlify.config.js";

  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }
  const imported = await import(path.resolve(configPath));
  const config = imported.default || imported;
  await new Bundler(config).run();
})();
