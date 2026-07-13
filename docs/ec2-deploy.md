# EC2 Deployment

The low-memory deployment path is to build somewhere other than the EC2 instance, then run only the traced Next.js standalone output on the server.
Use your instance login for `EC2_USER`, such as `ec2-user` on Amazon Linux or `ubuntu` on Ubuntu AMIs.

## Option A: Standalone Node Runtime

This option runs Postgres and Redis with Docker Compose, then runs the Next.js standalone Node server directly on the EC2 host.

Build and package locally:

```bash
./scripts/package-standalone.sh
```

Upload the tarball:

```bash
scp dist/deadlock-pro-standalone.tar.gz docker-compose.prod.yml EC2_USER@YOUR_EC2_IP:/opt/deadlock-pro/
```

On EC2:

```bash
cd /opt/deadlock-pro
tar -xzf deadlock-pro-standalone.tar.gz
docker compose -f docker-compose.prod.yml up -d postgres redis
PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production \
  APP_URL=http://YOUR_EC2_IP:3001 \
  STEAM_REALM=http://YOUR_EC2_IP:3001 \
  DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/deadlock_pro?schema=public \
  REDIS_URL=redis://127.0.0.1:6379 \
  SESSION_PASSWORD=replace-with-a-long-random-secret-at-least-32-characters \
  node server.js
```

Use a process manager such as `systemd` or `pm2` once the app starts correctly.

Apply the Prisma schema from your laptop without installing dependencies on EC2:

```bash
ssh -L 5433:127.0.0.1:5432 EC2_USER@YOUR_EC2_IP
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/deadlock_pro?schema=public npx prisma db push
```

## Option B: Docker Image Built Off-Server

Create a production environment file locally before uploading:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and replace `YOUR_EC2_IP` plus `SESSION_PASSWORD`.

Build the image locally for an x86 EC2 instance:

```bash
docker buildx build --platform linux/amd64 -t deadlock-pro:latest --load .
docker save deadlock-pro:latest | gzip > deadlock-pro-image.tar.gz
```

Upload and load it on EC2:

```bash
scp deadlock-pro-image.tar.gz docker-compose.prod.yml .env.production EC2_USER@YOUR_EC2_IP:/opt/deadlock-pro/
ssh EC2_USER@YOUR_EC2_IP
cd /opt/deadlock-pro
gunzip -c deadlock-pro-image.tar.gz | docker load
docker compose -f docker-compose.prod.yml up -d
```

The production compose file publishes the app on host port `3001` and keeps Postgres and Redis on the private Docker network.
The app container applies the Prisma schema with `prisma db push --skip-generate` before starting Next.js, so a fresh Postgres volume gets its tables automatically.
Postgres is also bound to `127.0.0.1:5432` on the EC2 host if you need to inspect or repair the database through an SSH tunnel.

If the app was started from an older image before this automatic schema step existed, either rebuild and redeploy the image or apply the schema once from your laptop:

```bash
ssh -L 5433:127.0.0.1:5432 EC2_USER@YOUR_EC2_IP
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/deadlock_pro?schema=public npx prisma db push
docker compose -f docker-compose.prod.yml restart app
```
