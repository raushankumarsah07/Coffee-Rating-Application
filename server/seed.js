const mongoose = require("mongoose");
const Coffee = require("./models/Coffee");
const data = require("./data/coffee_rating_seed.json");

// force=false: only seed when the collection is empty. force=true: wipe and re-seed.
async function seed(force = false) {
  if (force) await Coffee.deleteMany({});
  else if ((await Coffee.countDocuments()) > 0) return false;
  await Coffee.insertMany(
    data.map((d) => ({
      seedId: d.id,
      name: d.name,
      origin: d.origin,
      roast: d.roast,
      votes: d.votes,
      ratingSum: Math.round(d.rating * d.votes * 10) / 10,
    })),
  );
  return true;
}

module.exports = { seed };

// `npm run seed` resets the database to the original seed data
if (require.main === module) {
  require("dotenv").config();
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => seed(true))
    .then(() => {
      console.log(`Seeded ${data.length} coffees`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
