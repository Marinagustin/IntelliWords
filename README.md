# IntelliWords

Daily AI-generated English stories for Indian kids aged 4–12. Children read a short story tailored to their age group, tap vocabulary words to see definitions, and build a daily reading streak. Parents and teachers can track progress via a dashboard.

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling   | Tailwind CSS v4                     |
| Database  | PostgreSQL + Prisma 7               |
| AI        | Groq (`llama-3.3-70b-versatile`)    |
| State     | Zustand + TanStack Query v5         |
| Auth      | NextAuth v5 (beta)                  |

---

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+ running locally (or a hosted instance)
- **Groq API key** — free at [console.groq.com](https://console.groq.com/keys)

---

## Local Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd intelli-words
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/intelliwords"

# Groq AI — get a free key at https://console.groq.com/keys
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set up the database

Create the database, then run Prisma migrations:

```bash
createdb intelliwords          # or create it via psql / pgAdmin
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Application Routes

| Route        | Description                             |
| ------------ | --------------------------------------- |
| `/`          | Landing page                            |
| `/story`     | Daily story for the selected age group  |
| `/scan`      | Paste book text to extract vocabulary   |
| `/dashboard` | Parent/teacher view with child progress |

## Age Groups

| Group       | Age       | Vocab per day |
| ----------- | --------- | ------------- |
| 🌱 SEEDLING | 4–6 yrs   | 10 words      |
| 🌿 SPROUT   | 6–8 yrs   | 15 words      |
| 🌳 SAPLING  | 8–10 yrs  | 20 words      |
| 🌲 TREE     | 10–12 yrs | 25 words      |

---

## Available Scripts

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## API Endpoints

| Method | Endpoint                     | Description                         |
| ------ | ---------------------------- | ----------------------------------- |
| GET    | `/api/health`                | Health check                        |
| GET    | `/api/story/today?ageGroup=` | Fetch or generate today's story     |
| GET    | `/api/story/:id`             | Fetch story by ID                   |
| POST   | `/api/scan`                  | Extract vocabulary from pasted text |
| GET    | `/api/children`              | List children for a parent          |
| POST   | `/api/children`              | Create a child profile              |
| GET    | `/api/children/:id/progress` | Get reading progress summary        |
| POST   | `/api/progress`              | Record story completion             |
| POST   | `/api/events/word-tap`       | Record a vocabulary word tap        |

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
