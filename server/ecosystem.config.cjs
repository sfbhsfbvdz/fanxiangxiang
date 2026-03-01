module.exports = {
  apps: [
    {
      name: 'fanfou-server',
      script: './src/index.ts',
      interpreter: 'tsx',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
