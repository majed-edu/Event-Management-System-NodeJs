const express = require('express');
const app = express();
const port = 3000;


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running  on http://localhost:${port}`);
});






// https://event-management-system-nodejs.onrender.com/

// npm install prisma @prisma/client @prisma/adapter-mariadb @quixo3/prisma-session-store dotenv

// postgresql://event_management_db_crut_user:7Eli5cIDo0zHr2FXRdFLwRzWncWDFdtK@dpg-dbtpjeifngtc739rd0rg-a/event_management_db_crut

// npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql

// npm run migrate