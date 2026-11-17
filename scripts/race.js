require("dotenv").config();

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const slug = process.argv[2];

if (!slug) {
  console.error("Usage: npm run race -- <event-slug>");
  process.exit(1);
}

async function register(index) {
  const response = await fetch(`${baseUrl}/events/${slug}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      name: `Race User ${index}`,
      email: `race-${Date.now()}-${index}@example.com`,
    }),
    redirect: "manual",
  });

  return { index, status: response.status };
}

Promise.all(Array.from({ length: 20 }, (_, index) => register(index + 1)))
  .then((results) => {
    results.forEach(({ index, status }) => {
      console.log(`${index}: ${status}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
