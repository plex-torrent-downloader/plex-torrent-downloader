/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  serverBuildPath: "public/build/index.js",  // ESM server build
  serverModuleFormat: "esm",                   // Build server as ESM
  devServerPort: 8002,                         // For development, not used in production
  ignoredRouteFiles: ["**/.*"],
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  tailwind: true
};
