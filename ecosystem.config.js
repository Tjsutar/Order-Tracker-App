module.exports = {
  apps: [
    {
      name: "order-tracker",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
