/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  serverBuildPath: "build/index.js",  // Ensures only the build is generated
  devServerPort: 8002,                // For development, not used in production
  ignoredRouteFiles: ["**/.*"],
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  tailwind: true
};
