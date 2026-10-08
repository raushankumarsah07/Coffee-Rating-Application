# Coffee Rating Application (MERN)

Interactive voting app: React grid of coffee blends, Express API, MongoDB persistence, live score updates and a top-rated leaderboard.

## Run locally
1. `npm install` then `npm install --prefix client`
2. Copy `.env.example` to `.env`, set `MONGODB_URI`
3. `npm run dev` then open http://localhost:5173 (API on :4000)

On first start the server loads `server/data/coffee_rating_seed.json` if the database is empty. `npm run seed` resets everything to the seed data.

## API
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/coffees` | All coffees with rating and votes |
| POST | `/api/coffees/:id/vote` | Body `{ "rating": 1-5 }`, atomically increments votes |
| GET | `/api/leaderboard` | Top 5 by average rating (min 10 votes) |

## Production / Deploy (Vercel + Render + MongoDB Atlas)

### 1. Create the MongoDB Atlas database

Create a database user, allow the deployment service to connect, and copy the
connection string for the `coffee_rating` database.

### 2. Deploy the server to Render

Create a Render **Web Service** from this repository (the included
`render.yaml` can be used as a Blueprint).

- Build command: `npm install && npm run build`
- Start command: `npm start`
- `MONGODB_URI`: the MongoDB Atlas connection string
- `CLIENT_ORIGIN`: the final Vercel URL, for example
  `https://coffee-rating.vercel.app`

Copy the resulting Render service URL, such as
`https://coffee-rating-api.onrender.com`.

### 3. Deploy the client to Vercel

Import the same repository into Vercel. The included `vercel.json` sets the
client build and output directory.

Set this Vercel environment variable before deploying:

- `VITE_API_URL`: the Render service URL, without a trailing slash

For a local Vite client, copy `client/.env.example` to `client/.env` and set
`VITE_API_URL=http://localhost:4000`.

If the Vercel domain changes, update Render's `CLIENT_ORIGIN` and redeploy the
server.
