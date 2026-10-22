// ============================================================
// Hamburger menu (all pages)
// ============================================================
const menuOpen = document.getElementById("menu_open");
const menuClose = document.getElementById("menu_close");
const siteNav = document.getElementById("site_nav");

function openMenu(event) {
  siteNav.classList.add("is_open");
  menuOpen.setAttribute("aria-expanded", "true");
  // Only move focus to the X for keyboard users (event.detail is 0 for keyboard clicks),
  // so tapping/clicking doesn't draw a focus box around the X
  if (!event || event.detail === 0) menuClose.focus();
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

// ============================================================
// Booking form: custom date calendar (book page only)
// Booked days come from a published Google Sheet (CSV): one date per row in the first column
// (YYYY-MM-DD works best; a header row is fine). With no sheet link yet, every day from today on is open.
// ============================================================
const calendarBox = document.getElementById("event_calendar");
if (calendarBox) {
  setupBookingCalendar(calendarBox);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Reads a date from a sheet cell: 2026-11-14, or 11/14/2026 (month first; day first only when the day is over 12)
function readSheetDate(text) {
  const t = (text || "").trim();
  let y, mo, d;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m) {
    y = +m[1]; mo = +m[2]; d = +m[3];
  } else {
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
    if (!m) return "";
    y = +m[3];
    if (+m[1] > 12) { d = +m[1]; mo = +m[2]; }
    else { mo = +m[1]; d = +m[2]; }
  }
  const check = new Date(y, mo - 1, d);
  if (check.getFullYear() !== y || check.getMonth() !== mo - 1 || check.getDate() !== d) return "";
  return y + "-" + pad2(mo) + "-" + pad2(d);
}

function setupBookingCalendar(box) {
  const MIN_DAYS_AHEAD = 0;      // 0 = today can be picked, 1 = from tomorrow, 7 = at least a week ahead
  const MAX_MONTHS_AHEAD = 24;   // how far forward the arrow goes

  const form = box.closest("form");
  const booked = new Set();      // "YYYY-MM-DD" strings from the sheet

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = toIso(today);
  const earliest = new Date(today.getFullYear(), today.getMonth(), today.getDate() + MIN_DAYS_AHEAD);
  const firstMonth = monthIndexOf(today);            // months are counted as year * 12 + month
  const lastMonth = firstMonth + MAX_MONTHS_AHEAD;

  let viewMonth = firstMonth;
  let selectedIso = "";
  let focusIso = "";             // the day that can be reached with Tab (arrow keys move it)

  function toIso(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function fromIso(iso) {
    const p = iso.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function monthIndexOf(d) {
    return d.getFullYear() * 12 + d.getMonth();
  }
  function daysInMonth(first) {
    return new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  }
  function shiftMonth(d, delta) {
    const len = new Date(d.getFullYear(), d.getMonth() + delta + 1, 0).getDate();
    return new Date(d.getFullYear(), d.getMonth() + delta, Math.min(d.getDate(), len));
  }
  function isOpen(d) {
    return d >= earliest && !booked.has(toIso(d));
  }

  // ---- Build the markup once ----
  function navButton(label, pathData) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cal_nav";
    b.setAttribute("aria-label", label);
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + pathData +
      '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return b;
  }

  const card = document.createElement("div");
  card.className = "cal_card";

  const header = document.createElement("div");
  header.className = "cal_header";
  const prevBtn = navButton("Previous month", "M15 5l-7 7 7 7");
  const nextBtn = navButton("Next month", "M9 5l7 7-7 7");
  const title = document.createElement("h3");
  title.className = "chelsea cal_title";
  title.setAttribute("aria-live", "polite");
  header.appendChild(prevBtn);
  header.appendChild(title);
  header.appendChild(nextBtn);

  const weekdays = document.createElement("div");
  weekdays.className = "cal_weekdays";
  weekdays.setAttribute("aria-hidden", "true");
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(function (name) {
    const s = document.createElement("span");
    s.textContent = name;
    weekdays.appendChild(s);
  });

  const days = document.createElement("div");
  days.className = "cal_days";

  card.appendChild(header);
  card.appendChild(weekdays);
  card.appendChild(days);

  const message = document.createElement("p");
  message.className = "cal_message";
  message.setAttribute("role", "status");

  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.name = "event_date";
  hidden.id = "event_date";

  box.textContent = "";          // also removes the <noscript> fallback
  box.appendChild(card);
  box.appendChild(message);
  box.appendChild(hidden);

  function setMessage(text) {
    message.textContent = text;
  }

  // The day that gets the Tab stop when a month is shown: the picked day, else the first open day
  function defaultFocus(first) {
    if (selectedIso && monthIndexOf(fromIso(selectedIso)) === viewMonth) return selectedIso;
    const count = daysInMonth(first);
    for (let n = 1; n <= count; n++) {
      const d = new Date(first.getFullYear(), first.getMonth(), n);
      if (isOpen(d)) return toIso(d);
    }
    return toIso(first);
  }

  function render() {
    const first = new Date(Math.floor(viewMonth / 12), viewMonth % 12, 1);
    title.textContent = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    prevBtn.disabled = viewMonth <= firstMonth;
    nextBtn.disabled = viewMonth >= lastMonth;

    if (!focusIso || monthIndexOf(fromIso(focusIso)) !== viewMonth) focusIso = defaultFocus(first);

    days.textContent = "";
    for (let i = 0; i < first.getDay(); i++) {
      const blank = document.createElement("span");
      blank.className = "cal_blank";
      days.appendChild(blank);
    }

    const count = daysInMonth(first);
    for (let n = 1; n <= count; n++) {
      const d = new Date(first.getFullYear(), first.getMonth(), n);
      const iso = toIso(d);
      const isBooked = booked.has(iso);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal_day";
      btn.dataset.iso = iso;
      btn.textContent = n;
      btn.tabIndex = iso === focusIso ? 0 : -1;
      btn.setAttribute("aria-pressed", iso === selectedIso ? "true" : "false");
      btn.setAttribute("aria-label",
        d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) +
        (isBooked ? ", already booked" : ""));
      if (iso === todayIso) btn.classList.add("is_today");
      if (isBooked) btn.classList.add("is_booked");
      if (!isOpen(d)) btn.setAttribute("aria-disabled", "true");   // not "disabled", so arrow keys can still land on it
      days.appendChild(btn);
    }
  }

  function focusDay(iso) {
    const b = days.querySelector('[data-iso="' + iso + '"]');
    if (b) b.focus({ preventScroll: true });
  }

  function moveTo(d) {
    const idx = monthIndexOf(d);
    if (idx < firstMonth || idx > lastMonth) return;
    viewMonth = idx;
    focusIso = toIso(d);
    render();
    focusDay(focusIso);
  }

  // ---- Interaction ----
  prevBtn.addEventListener("click", function () {
    if (viewMonth > firstMonth) { viewMonth--; render(); }
  });
  nextBtn.addEventListener("click", function () {
    if (viewMonth < lastMonth) { viewMonth++; render(); }
  });

  days.addEventListener("click", function (event) {
    const btn = event.target.closest("button[data-iso]");
    if (!btn) return;
    const iso = btn.dataset.iso;

    if (btn.getAttribute("aria-disabled") === "true") {
      if (booked.has(iso)) setMessage("Sorry, that day is already booked. Please pick another day.");
      return;
    }

    selectedIso = iso;
    focusIso = iso;
    hidden.value = iso;
    setMessage("");
    render();
    focusDay(iso);
  });

  // Arrow keys move by day / week, Page Up and Page Down by month
  days.addEventListener("keydown", function (event) {
    const btn = event.target.closest("button[data-iso]");
    if (!btn) return;
    const d = fromIso(btn.dataset.iso);
    let target = null;

    if (event.key === "ArrowLeft") target = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    else if (event.key === "ArrowRight") target = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    else if (event.key === "ArrowUp") target = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
    else if (event.key === "ArrowDown") target = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    else if (event.key === "PageUp") target = shiftMonth(d, -1);
    else if (event.key === "PageDown") target = shiftMonth(d, 1);
    else return;

    event.preventDefault();
    moveTo(target);
  });

  // The calendar isn't a normal input, so the "pick a day" check is done here
  if (form) {
    form.addEventListener("submit", function (event) {
      if (selectedIso) return;
      event.preventDefault();
      setMessage("Please pick the day of your event.");
      const stop = days.querySelector('[tabindex="0"]');
      if (stop) stop.focus();
    });
  }

  // ---- Booked days from the Google Sheet ----
  async function loadBooked() {
    const url = box.dataset.bookedUrl;
    if (!url || url.indexOf("PASTE") !== -1) return;     // no sheet yet: every future day stays open

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("HTTP " + response.status);
      const rows = parseCSV(await response.text());

      rows.forEach(function (r) {
        const iso = readSheetDate(r[0]);                 // header and blank rows are skipped automatically
        if (iso) booked.add(iso);
      });

      if (booked.has(selectedIso)) {
        selectedIso = "";
        hidden.value = "";
        setMessage("Sorry, that day was just booked. Please pick another day.");
      }
      render();
    } catch (error) {
      console.error("Could not load booked dates:", error);
      setMessage("We couldn't check booked days right now. We'll confirm your date when we reply.");
    }
  }

  render();
  loadBooked();
}