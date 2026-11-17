const crypto = require("crypto");
const prisma = require("../prisma");

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

function makeSlug(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${base || "event"}-${crypto.randomBytes(3).toString("hex")}`;
}

function showCreate(req, res) {
  res.render("events/create", { error: null });
}

async function create(req, res) {
  const title = (req.body.title || "").trim();
  const location = (req.body.location || "").trim() || null;
  const startsAt = new Date(req.body.startsAt);
  const capacity = Number.parseInt(req.body.capacity, 10);

  if (
    !title ||
    title.length > 200 ||
    Number.isNaN(startsAt.getTime()) ||
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    (location && location.length > 255)
  ) {
    return res.status(400).render("events/create", {
      error: "Enter a valid title, date, and capacity.",
    });
  }

  let event;
  try {
    event = await prisma.event.create({
      data: {
        organizerId: req.session.user.id,
        slug: makeSlug(title),
        title,
        location,
        startsAt,
        capacity,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).render("events/create", {
        error: "That event link is already in use.",
      });
    }
    throw error;
  }

  res.redirect(`/events/${event.slug}/attendees`);
}

async function dashboard(req, res) {
  const events = await prisma.event.findMany({
    where: { organizerId: req.session.user.id },
    include: {
      _count: { select: { registrations: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  res.render("events/dashboard", { events, error: null });
}

async function showPublic(req, res) {
  const event = await prisma.event.findUnique({
    where: { slug: req.params.slug },
    include: {
      _count: { select: { registrations: true } },
    },
  });

  if (!event) {
    return res.status(404).render("404", { error: "Event not found." });
  }

  res.render("events/public", {
    event,
    registeredCount: event._count.registrations,
    registered: req.query.registered === "1",
    error: null,
  });
}

async function register(req, res, attempt = 0) {
  const name = (req.body.name || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();

  if (!name || name.length > 100 || !email || email.length > 255) {
    return registerPage(req, res, "Enter a valid name and email.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const eventRows = await tx.$queryRaw`
        SELECT "id", "capacity"
        FROM "events"
        WHERE "slug" = ${req.params.slug}
        FOR UPDATE
      `;

      if (eventRows.length === 0) {
        throw Object.assign(new Error("Event not found"), { code: "EVENT_NOT_FOUND" });
      }

      const event = eventRows[0];
      const registeredCount = await tx.registration.count({
        where: { eventId: event.id },
      });

      if (registeredCount >= event.capacity) {
        throw Object.assign(new Error("Event is full"), { code: "EVENT_FULL" });
      }

      await tx.registration.create({
        data: {
          eventId: event.id,
          name,
          email,
        },
      });
    }, {
      isolationLevel: "ReadCommitted",
      maxWait: 30000,
      timeout: 30000,
    });

    res.redirect(`/events/${req.params.slug}?registered=1`);
  } catch (error) {
    if (error.code === "EVENT_NOT_FOUND") {
      return res.status(404).render("404", { error: "Event not found." });
    }
    if (error.code === "EVENT_FULL") {
      return registerPage(req, res, "Sorry, this event is full.");
    }
    if (error.code === "P2002") {
      return registerPage(req, res, "This email is already registered.");
    }
    if (error.code === "P2034" && attempt < 5) {
      return register(req, res, attempt + 1);
    }
    throw error;
  }
}

async function registerPage(req, res, error) {
  const event = await prisma.event.findUnique({
    where: { slug: req.params.slug },
    include: { _count: { select: { registrations: true } } },
  });

  if (!event) {
    return res.status(404).render("404", { error: "Event not found." });
  }

  return res.status(400).render("events/public", {
    event,
    registeredCount: event._count.registrations,
    registered: false,
    error,
  });
}

async function attendees(req, res) {
  const event = await prisma.event.findFirst({
    where: {
      slug: req.params.slug,
      organizerId: req.session.user.id,
    },
    include: {
      registrations: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) {
    return res.status(404).render("404", { error: "Event not found." });
  }

  res.render("events/attendees", { event });
}

module.exports = {
  requireLogin,
  showCreate,
  create,
  dashboard,
  showPublic,
  register,
  attendees,
};
