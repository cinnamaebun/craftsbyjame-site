# Crafts by Jame

A responsive website for Crafts by Jame, a custom craft booth business. Visitors can browse the products, see packages and book the booth for their event, and check upcoming pop-ups.

## Pages

| Page | File | What it has |
| --- | --- | --- |
| Home | `index.html` | Landing section, crafting reel, upcoming pop-ups |
| About | `about.html` | Story behind the business and the product line |
| Book | `book.html` | Package rates and a booking form |
| Contact | `contact.html` | Official contacts and a calendar of events |

## Features

- Responsive layout with three breakpoints: phone (400px), tablet (700px) and desktop (1440px), built phone-first
- Hamburger navigation menu operated with JavaScript (keyboard accessible, closes with the Escape key)
- Booking form with a native date picker
- Calendar of events that reads from a Google Sheet, so the business owner can update it without touching the code

## Built with

- HTML5
- CSS3
- JavaScript (no frameworks or libraries)

## Project structure

```
├── index.html
├── about.html
├── book.html
├── contact.html
├── styles.css
├── script.js
└── img/
```

## Getting started

1. Clone or download this repository.
2. Open `index.html` in a browser, or serve the folder with a local server such as the VS Code Live Server extension. A local server is recommended so the events calendar can load.

## Updating the calendar of events

Upcoming events come from a Google Sheet, so no code changes are needed to update them.

1. Create a Google Sheet with two columns in row 1: `date` and `venue`.
2. Format the date column as plain text and enter dates as `YYYY-MM-DD` (for example, `2026-11-07`).
3. Go to **File → Share → Publish to web**, choose the events tab and the **CSV** format, then publish and copy the link.
4. Paste the link into the `data-sheet-url` attribute of the `#events` element in `contact.html`.

Past events are hidden automatically. Anything in a published tab is public, so keep private notes in other tabs.

## Status

- [x] HTML structure for all four pages (phone layout)
- [x] Hamburger menu
- [x] Events calendar loaded from Google Sheets
- [ ] Phone styles
- [ ] Tablet styles
- [ ] Desktop styles
- [ ] Booking form submission

