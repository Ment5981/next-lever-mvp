# Aliyun ECS deployment

The production target is `https://app.xuanshu.fun`.

## One-time ECS setup

Run these commands as the deployment user on Ubuntu 24.04:

```bash
sudo apt update
sudo apt install -y git nginx curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

sudo mkdir -p /var/www/next-lever-mvp
sudo chown -R "$USER":"$USER" /var/www/next-lever-mvp
pm2 startup
```

The GitHub Actions workflow uploads the GitHub `main` source over SSH/SCP,
creates `.env.local` from `.env.example` when needed, builds the app, and
restarts PM2. The ECS instance does not need outbound access to GitHub.

Run the `sudo ...` command printed by `pm2 startup`, then run `pm2 save` once more.

Install the reverse-proxy configuration after the first successful GitHub Actions deployment:

```bash
sudo cp deploy/nginx/app.xuanshu.fun.conf /etc/nginx/sites-available/next-lever-mvp
sudo ln -sfn /etc/nginx/sites-available/next-lever-mvp /etc/nginx/sites-enabled/next-lever-mvp
sudo nginx -t
sudo systemctl reload nginx
```

## DNS

Create an `A` record at the DNS provider for `app.xuanshu.fun` pointing to the ECS public IPv4 address.
After DNS resolves, enable HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.xuanshu.fun
```

## GitHub Actions secrets

Add these secrets to the repository's `production 3.` environment (or change
the workflow's `environment` value if you rename it):

- `ECS_HOST`: ECS public IPv4 address
- `ECS_PORT`: `22`
- `ECS_USER`: deployment username
- `ECS_SSH_KEY`: private key matching the user's `~/.ssh/authorized_keys`
- `ECS_KNOWN_HOSTS`: optional output of `ssh-keyscan -p 22 <ECS_HOST>`

Optional values are `ECS_PATH` (default `/var/www/next-lever-mvp`) and `PM2_APP_NAME` (default `next-lever-mvp`).

Keep `.env.local` only on the server. Do not put API keys or OAuth secrets in GitHub workflow files.
