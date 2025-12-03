# openviva – register

⭐ **star us on github — your support keeps the project alive!**

register is a cleaner, faster, improved web ui for the classeviva school register.
this is the modern, revived version of *syswhitedev’s sysregister*, rebuilt for stability and long-term maintenance.

---

## selfhost 🔧

classeviva’s api endpoints are geoblocked and blocklist several public ip ranges (including many vps providers, vercel, etc.).
to bypass this limitation, the recommended setup is to selfhost your own instance and expose it securely through a cloudflare tunnel.

## how to selfhost your instance of register🚀

### 1. clone the project

```bash
git clone https://github.com/open-viva/register.git
cd register
```

### 2. configure the environment

rename the env file:

```
.env.example → .env
```

the environment variables look like this:

```env
# db
DATABASE_URL="file:./database.db"

# auth
JWT_SECRET="KEY"

# posthog
NEXT_PUBLIC_POSTHOG_KEY="KEY"
NEXT_PUBLIC_POSTHOG_HOST="ENDPOINT"
```

### 3. install dependencies

```bash
npm install
```

### 4. build the project

```bash
npm run build
```

prisma will set up the local database, and the app will start on **port 3000**.

### note

for development builds, use:

```bash
npm run dev
```

---

## docker support 🐳

coming soon.
