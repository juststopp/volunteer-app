module.exports = {
  apps: [{
    name: "volunteer",
    cwd: "/home/just/projets/volunteer-app",
    script: "npm",
    args: "start",
    env: {
      PORT: 3000,
      NODE_ENV: "production"
    }
  }]
}
