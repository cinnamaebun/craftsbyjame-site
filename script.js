// ============================================================
// Hamburger menu (all pages)
// ============================================================
const menuOpen = document.getElementById("menu_open");
const menuClose = document.getElementById("menu_close");
const siteNav = document.getElementById("site_nav");

function openMenu() {
  siteNav.classList.add("is_open");
  menuOpen.setAttribute("aria-expanded", "true");
  menuClose.focus();
}

function closeMenu() {
  siteNav.classList.remove("is_open");
  menuOpen.setAttribute("aria-expanded", "false");
}

menuOpen.addEventListener("click", openMenu);
menuClose.addEventListener("click", closeMenu);

// Close the menu after tapping any link inside it
siteNav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", closeMenu);
});

// Close with the Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && siteNav.classList.contains("is_open")) {
    closeMenu();
    menuOpen.focus();
  }
});

// ============================================================
// Calendar of events (contact page only)
// Reads a published Google Sheet (CSV) with two columns:
//   date (YYYY-MM-DD)  |  venue
// ============================================================
const eventsBox = document.getElementById("events");
if (eventsBox) {
  loadEvents(eventsBox);
}

function showMessage(box, text) {
  box.textContent = "";
  const p = document.createElement("p");
  p.className = "events_message";
  p.textContent = text;
  box.appendChild(p);
}

// Turns CSV text into an array of rows (handles "quoted, values")
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cell += ch; }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell); cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row);
      row = []; cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function loadEvents(box) {
  const url = box.dataset.sheetUrl;
  if (!url || url.indexOf("PASTE") !== -1) {
    showMessage(box, "Events coming soon!");
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const rows = parseCSV(await response.text());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = rows.slice(1)               // skip the header row
      .map(function (r) {
        const iso = (r[0] || "").trim();
        const venue = (r[1] || "").trim();
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
        if (!m || !venue) return null;         // skip blank or badly typed rows
        return { iso: iso, venue: venue, date: new Date(+m[1], +m[2] - 1, +m[3]) };
      })
      .filter(function (ev) { return ev && ev.date >= today; })   // hide past events
      .sort(function (a, b) { return a.date - b.date; });

    renderEvents(box, events);
  } catch (error) {
    console.error("Could not load events:", error);
    showMessage(box, "Events can't be loaded right now. Check our Facebook and Instagram for updates!");
  }
}

// Builds one card per month, same markup as the original static version
function renderEvents(box, events) {
  box.textContent = "";

  if (events.length === 0) {
    showMessage(box, "No upcoming pop-ups right now. Follow us on Facebook and Instagram for updates!");
    return;
  }

  let currentMonth = "";
  let list = null;

  events.forEach(function (ev) {
    const monthKey = ev.iso.slice(0, 7);       // "2026-11"

    if (monthKey !== currentMonth) {
      currentMonth = monthKey;

      const card = document.createElement("article");
      card.className = "event_month";

      const heading = document.createElement("h3");
      heading.className = "chelsea month_title";
      const monthTime = document.createElement("time");
      monthTime.setAttribute("datetime", monthKey);
      monthTime.textContent = ev.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      heading.appendChild(monthTime);

      list = document.createElement("ul");
      list.className = "event_list";

      card.appendChild(heading);
      card.appendChild(list);
      box.appendChild(card);
    }

    const item = document.createElement("li");
    item.className = "event_item";

    const day = document.createElement("time");
    day.className = "event_day";
    day.setAttribute("datetime", ev.iso);
    day.textContent = ev.date.getDate();

    const place = document.createElement("span");
    place.className = "event_place";
    place.textContent = ev.venue;

    item.appendChild(day);
    item.appendChild(place);
    list.appendChild(item);
  });
}