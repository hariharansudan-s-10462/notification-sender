module.exports = {
  srcRoot: ".",
  outRoot: "app",
  rules: [
    {
      type: "bundle",
      src: "backend/dist",
      rewritePath: (destPath) =>
        destPath
          .replace("/backend/dist/", "/dist/")
          .replace("/backend/node_modules/", "/node_modules/"),
    },
    {
      type: "static",
      src: "frontend/dist",
      rewritePath: (destPath) =>
        destPath.replace("/frontend/dist/", "/public/"),
    },
    {
      type: "static",
      src: "config/app-config.json",
      rewritePath: (destPath) =>
        destPath.replace("/config/app-config.json", "/app-config.json"),
    },
  ],
};
