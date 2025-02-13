module.exports = {
    apps: [
      {
        name: 'blackmarket',
        script: 'app.js', // Path to your main application file
        instances: 'max', // Or specify a number of instances
        exec_mode: 'cluster', // Use cluster mode
        env: {
          NODE_ENV: 'production',
        },
    
      },
    ],
    deploy: {
      production: {
        user: 'root', // Your SSH username
        host: '192.168.0.16',
        port: '8022', // SSH port
        ref: 'origin/main', // Git branch to deploy
        repo: 'https://github.com/slysmoke/blackmarket.git', // Your Git repository
        path: '/data/data/com.termux/files/home/blackmarket', // Path on the remote server
        'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production', // Commands to run after deployment
      },
    },
  };