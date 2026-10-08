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

## Production / Deploy (Render + MongoDB Atlas)
Build Command: `npm install && npm run build`  
Start Command: `npm start`  
Environment variable: `MONGODB_URI`
