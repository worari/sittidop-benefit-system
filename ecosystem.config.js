module.exports = {
  apps: [
    {
      name: "wer-rta",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: "/home/adminrta/wer-rta",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        NEXT_PUBLIC_BASE_PATH: "/wer-rta",
      },
    },
  ],
};
