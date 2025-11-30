# SysRegister

⭐ Star us on GitHub — your support keeps us motivated!

SysRegister offers an improved web UI for the ClasseViva school register and adds a few quality-of-life features.

---

### SysRegister has been forced to shut down.  
#### Recently, ClasseViva has decided to ban our servers, as a result, SysRegister can no longer access the necessary data to function. However, you can now **self-host your own instance** to continue using SysRegister!

---

## 🚀 Self-Hosting Guide

Self-hosting allows you to run your own instance of SysRegister, avoiding centralized server bans. You can deploy it using Docker for the easiest setup.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- Basic knowledge of terminal/command line

### Quick Start with Docker Compose

#### Option 1: Automated Setup (Recommended)

Run the quick start script:
```bash
git clone https://github.com/gablilli/sysregister-reborn.git
cd sysregister-reborn
./start.sh
```

This script will:
- Create the `.env` file with a random JWT secret
- Create necessary data directories
- Build and start the Docker containers
- Display helpful information

#### Option 2: Manual Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/gablilli/sysregister-reborn.git
   cd sysregister-reborn
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file** with your configuration:
   ```env
   # Database (SQLite - default configuration)
   DATABASE_URL="file:/app/data/database.db"
   
   # Authentication - IMPORTANT: Generate a secure random key!
   JWT_SECRET="your-super-secret-jwt-key-change-this"
   
   # PostHog Analytics (Optional - leave empty to disable)
   NEXT_PUBLIC_POSTHOG_KEY=""
   NEXT_PUBLIC_POSTHOG_HOST=""
   ```

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Access SysRegister**
   
   Open your browser and navigate to `http://localhost:3000`

### Configuration Options

#### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection string | Yes | `file:/app/data/database.db` |
| `JWT_SECRET` | Secret key for JWT authentication | Yes | - |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key | No | - |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog analytics host | No | - |

#### Ports

The application runs on port `3000` by default. You can change this in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Access on port 8080 instead
```

### Data Persistence

The following directories are persisted using Docker volumes:

- `./data` - SQLite database
- `./userassets` - User uploaded content (avatars, banners)

These directories will be created automatically on first run.

### Managing the Application

**View logs:**
```bash
docker-compose logs -f
```

**Stop the application:**
```bash
docker-compose down
```

**Restart the application:**
```bash
docker-compose restart
```

**Update to latest version:**
```bash
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Manual Docker Build (Advanced)

If you prefer to build and run manually:

```bash
# Build the image
docker build -t sysregister .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="file:/app/data/database.db" \
  -e JWT_SECRET="your-secret-key" \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/userassets:/app/public/userassets \
  --name sysregister \
  sysregister
```

### Local Development (Without Docker)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### Troubleshooting

**Issue: Database locked errors**
- Ensure only one instance is running
- Check that the `./data` directory has proper permissions

**Issue: Cannot connect to ClasseViva**
- This is expected if you're running behind a banned IP
- Consider using a VPN or proxy

**Issue: User assets not persisting**
- Verify the `./userassets` volume is properly mounted
- Check directory permissions

### Security Recommendations

- **Always change the default `JWT_SECRET`** to a strong, random value
- Use HTTPS in production (consider using a reverse proxy like Nginx or Caddy)
- Keep your instance updated with the latest security patches
- Regularly backup the `./data` directory

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### License

See LICENSE file for details.

