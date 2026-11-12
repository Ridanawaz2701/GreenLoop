# Design Note – GreenLoop (Recycling Pickup Coordinator)

**Course:** CS344 Web Engineering · **Assignment 1** · **Assigned idea:** #19 Recycling Pickup Coordinator

## 1. User and problem

**User:** A household or small shop owner in a Rawalpindi neighbourhood who already sorts recyclables (paper, plastic, glass, metal, small e-waste) but has no simple way to hand them to a collector.

**Problem:** People don't know which collection slots exist in their zone, which materials each slot accepts, or whether a slot still has space. Phone calls and WhatsApp groups lead to double bookings and rejected loads.

**Core workflow:** Browse or filter slots → pick a slot → choose materials and weight → app checks conflicts → confirmation and a "My requests" list.

## 2. WDLC stages

| Stage | What was done for this assignment |
|---|---|
| Planning | Defined the user, problem and scope (client-side only; backend comes in later assignments). |
| Analysis | Listed requirements: view slots, filter, request pickup, validate, estimate credit, cancel. |
| Design | Wireframes below, green/white palette, mobile-first layout, accessible form patterns. |
| Implementation | Semantic HTML, CSS (Flexbox/Grid, variables, media queries), vanilla JS (DOM events). |
| Testing | Manual tests on phone/tablet/desktop widths, invalid input, full slot, duplicate and same-day clash, empty filter results, keyboard-only use. |
| Deployment | GitHub repository + GitHub Pages URL. |
| Maintenance | Later assignments add a server, database, authentication and a real coordinator role. |

## 3. Wireframes

### Mobile (< 600px)
```
+------------------------+
| ♻ GreenLoop            |
| Slots Request Mine     |
+------------------------+
| Hero + 3 steps         |
+------------------------+
| Filters (stacked)      |
| [search][zone][mat]... |
+------------------------+
| Slot card              |
| Slot card              |
+------------------------+
| Request form           |
| Live estimate (below)  |
+------------------------+
| My requests            |
+------------------------+
```

### Tablet (≥ 600px)
```
+----------------------------------+
| ♻ GreenLoop    Slots Request ... |
+----------------------------------+
| Filters: 2 columns               |
| Slot card | Slot card            |
| Slot card | Slot card            |
| Form (2-col materials)           |
| Live estimate                    |
+----------------------------------+
```

### Desktop (≥ 992px)
```
+---------------------------------------------------+
| ♻ GreenLoop            Slots Request Mine About   |
+---------------------------------------------------+
| Filters in one row                                |
| Card | Card | Card                                |
| Card | Card | Card                                |
+---------------------------------------------------+
| Request form (2/3)       | Live estimate (1/3,    |
|                          | sticky)                |
+---------------------------------------------------+
| My requests                                       |
+---------------------------------------------------+
```

## 4. Browser client vs server

| Runs in the browser (this assignment) | Needs a server (later assignments) |
|---|---|
| Rendering slots, filtering and search | Storing slots and requests in a shared database |
| Form validation and conflict checking | Re-checking capacity on the server so two users can't take the last place |
| Eco-credit calculation | User accounts and login |
| Saving the user's requests in `localStorage` | Collector/coordinator dashboard, status workflow |
| Cancel request | Notifications (SMS/email) |

Because all checks run in the browser, a user could bypass them with developer tools. This is why the server must repeat the validation in Assignment 2.

## 5. Interactions

1. **Filter and search slots:** text search, zone, material, day and "only slots with space". Updates the result count and shows an empty state.
2. **Request form with live calculation and conflict checking:** the estimate updates as materials and weight change. On submit it rejects: invalid fields, full slots, unaccepted materials, loads over the slot limit, duplicate requests and same-day clashes.

## 6. Accessibility choices

Skip link, one `h1`, ordered headings, labelled controls, `fieldset`/`legend`, proper input types (`tel`, `number`, `search`), `role="alert"` for errors, `aria-live` for results and estimate, visible focus outlines, 44px touch targets, no colour-only status (text "Fully booked").
