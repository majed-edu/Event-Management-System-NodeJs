
require("dotenv/config");

const app = require("./app");
const prisma = require("./prisma");

const port = process.env.PORT || 3000;

async function start() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Connected to PostgreSQL");

    app.listen(port, "0.0.0.0", () => {
      console.log(`Mawid is running on port ${port}`);
    });
  } catch (err) {
    console.error(`Could not connect to PostgreSQL: ${err.message}`);
    process.exit(1);
  }
}

start();






// https://event-management-system-nodejs.onrender.com/

// npm install prisma @prisma/client @prisma/adapter-mariadb @quixo3/prisma-session-store dotenv


// npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql

// npm run migrate