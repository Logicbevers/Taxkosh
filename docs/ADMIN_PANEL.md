# TaxKosh Admin Panel — Functional Specification

> Mark this document up with `[CHANGE: ...]` notes next to anything you want
> modified. I'll process every comment in one batch.

**Audience:** TaxKosh internal admins (super-admins, tax executives, senior reviewers)
**Base path:** `/dashboard/admin`
**Access:** Strictly role = `ADMIN`. Non-admins are redirected to `/unauthorized`.

---

## 1. Global Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Top Nav: [TaxKosh logo]  Dashboard  •  Admin OPS          [🔔]  [Avatar]    │
├────────────────────────┬─────────────────────────────────────────────────────┤
│                        │                                                     │
│  ┌─ TAXKOSH ──────┐    │                                                     │
│  │  Admin OS       │   │                                                     │
│  └─────────────────┘   │                                                     │
│                        │                                                     │
│  CORE OPERATIONS       │                                                     │
│  ▸ Overview            │                                                     │
│  ▸ Categories          │             [ active page content ]                 │
│  ▸ Services            │                                                     │
│  ▸ Service Requests    │                                                     │
│  ▸ Customers           │                                                     │
│  ▸ Bulk Import         │                                                     │
│  ▸ Audit Logs          │                                                     │
│  ▸ Settings            │                                                     │
│                        │                                                     │
│  ──────────────────    │                                                     │
│  [N] Admin             │                                                     │
│      ADMIN NODE        │                                                     │
└────────────────────────┴─────────────────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| **Top Nav (full-width)** | Logo (`TaxKosh`), two top-level links (`Dashboard`, `Admin OPS`), notifications bell, user avatar |
| **Sidebar (256px fixed, dark)** | 8 items in `CORE OPERATIONS` section + signed-in admin chip at the bottom |
| **Main area** | Light theme, page-specific content with consistent 32-px padding and max-width 7xl |

---

## 2. Sidebar Navigation

| Order | Label | Route | Icon | Purpose |
|-------|-------|-------|------|---------|
| 1 | **Overview** | `/dashboard/admin` | `LayoutDashboard` | KPI dashboard + activity feed |
| 2 | **Categories** | `/dashboard/admin/categories` | `Layers` | Level 1 + Level 2 service taxonomy |
| 3 | **Services** | `/dashboard/admin/services` | `Briefcase` | Level 3 services & their plans |
| 4 | **Service Requests** | `/dashboard/admin/service-requests` | `ClipboardList` | Taxpayer requests, SLA tracking |
| 5 | **Customers** | `/dashboard/admin/customers` | `Users` | Taxpayer registry |
| 6 | **Bulk Import** | `/dashboard/admin/import` | `UploadCloud` | CSV upload of customers |
| 7 | **Audit Logs** | `/dashboard/admin/audit-logs` | `Activity` | Compliance event trail |
| 8 | **Settings** | `/dashboard/admin/settings` | `Settings` | Team management, system flags |

**Active state:** Left primary-coloured bar + filled icon + slight slide animation.

---

## 3. Overview Page  `/dashboard/admin`

### Layout
```
HEADER: "Operational Intelligence"        [● NODE ACTIVE chip]
        Platform-wide performance heuristics ...

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Service Reqs │ Active       │ In           │ Success Rate │
│      6       │ Customers 11 │ Treatment 0  │      33%     │
│ 1 awaiting   │ Onboarded    │ Active flows │ Completed    │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌────────────────────────────────┐ ┌──────────────────────────┐
│ SYSTEMIC ACTIVITY PULSE        │ │ CUSTOMER VELOCITY        │
│   (last 5 audit events)        │ │   +11 net entity growth  │
│   LOGIN — Admin — 14:23        │ │   (progress bar 78%)     │
│   PROFILE_UPDATE — Kernel ...  │ ├──────────────────────────┤
│   ...                          │ │ QUICK ACCESS             │
│                                │ │ ▸ Operational Review     │
└────────────────────────────────┘ └──────────────────────────┘
```

### Data sources
- KPI cards: `prisma.serviceRequest.groupBy(status)`, `prisma.user.count()`
- Activity feed: latest 5 `AuditLog` rows (`include: user`)

### Actions
- None on this page (read-only dashboard).

---

## 4. Categories Page  `/dashboard/admin/categories`  *(Taxonomy Engine)*

### Purpose
Manage **Level 1** (Category) and **Level 2** (SubCategory) of the service taxonomy.

### Layout
```
HEADER: "Taxonomy Engine"             [+ NEW CATEGORY] button
        Orchestrating the structural hierarchy ...

┌──────────────────────────────────────────────────────────────────────┐
│ STRUCTURE NODES │ ENDPOINT SLUG │ PRIORITY │ VISIBILITY │ DIRECTIVES │
├──────────────────────────────────────────────────────────────────────┤
│ ▸ 📁 Income Tax  /income-tax     ORD_01     ACTIVE       + SUB-NODE  │
│   2 branching points                                     [edit][del] │
│                                                                      │
│   (expanded)                                                         │
│   ↳ ITR Filing       2 services                          [edit][del] │
│   ↳ Tax Planning     1 service                           [edit][del] │
│                                                                      │
│ ▸ 📁 GST         /gst            ORD_02     ACTIVE       + SUB-NODE  │
│ ▸ 📁 TDS         /tds            ORD_03     ACTIVE       + SUB-NODE  │
└──────────────────────────────────────────────────────────────────────┘
```

### Actions
| Action | Trigger | API |
|--------|---------|-----|
| Create category | `+ NEW CATEGORY` → opens "Register New Category" modal | `POST /api/admin/categories` |
| Add sub-category | `+ SUB-NODE` on a row | `POST /api/admin/subcategories` |
| Edit category | ✎ icon | `PATCH /api/admin/categories/[id]` |
| Delete category | 🗑 icon (blocked if has children) | `DELETE /api/admin/categories/[id]` |
| Edit sub-category | ✎ icon on sub-node row | `PATCH /api/admin/subcategories/[id]` |
| Delete sub-category | 🗑 icon (blocked if has services) | `DELETE /api/admin/subcategories/[id]` |

### Create Category modal fields
- **Taxonomy Label** (name, required, max 100)
- **URL Slug** (lowercase alphanumeric + hyphens, required, unique)
- **Description** (optional, max 500)
- **Display Order** (number, default 0)
- **Visibility State** (`active` / `inactive`)

> `[CHANGE: ...]`

---

## 5. Services Page  `/dashboard/admin/services`  *(Service Inventory)*

### Purpose
Manage **Level 3** services (e.g. "ITR-1 Salaried", "GSTR-1 Monthly") and their associated plans.

### Layout
```
HEADER: "Service Inventory"             [+ NEW SERVICE] button
        Curating the execution parameters ...

[ 🔍 Filter inventory by service name, category or hierarchy... ]
                                                       LISTED · 11 · [filter]

┌────────────────────────────────────────────────────────────────────────────┐
│ SERVICE DEFINITION   │ TAXONOMY HIERARCHY │ SLA  │ DOCS │ STATUS │ ACTIONS │
├────────────────────────────────────────────────────────────────────────────┤
│ Form 24Q (Salary)    │ TDS COMPLIANCE     │ 72h  │ 3    │ ACTIVE │ 🏷 ✎ 🗑 │
│ ID_TDS-FORM-24Q      │ ↳ TDS Returns      │      │      │        │         │
│                      │                    │      │      │        │         │
│ GSTR-1 + GSTR-3B     │ GST                │ 72h  │ 3    │ ACTIVE │ 🏷 ✎ 🗑 │
│ ID_GST-1-3B-MONTHLY  │ ↳ GST Returns      │      │      │        │         │
│ ...                                                                         │
└────────────────────────────────────────────────────────────────────────────┘
```

### Actions
| Action | Trigger | API |
|--------|---------|-----|
| Create service | `+ NEW SERVICE` modal | `POST /api/admin/services` |
| Manage plans | 🏷 icon → opens `/dashboard/admin/services/[id]/plans` | — |
| Edit service | ✎ icon | `PATCH /api/admin/services/[id]` |
| Delete service | 🗑 icon (blocked if has plans/requests) | `DELETE /api/admin/services/[id]` |

### Create Service modal fields
- **Service Name** (required, max 200)
- **Slug** (lowercase alphanumeric + hyphens, unique)
- **Category** (dropdown, required)
- **Sub-Category** (cascading dropdown filtered by Category)
- **Description** (max 2000 chars)
- **Required Documents** (multi-line list — one per row)
- **SLA Hours** (1–720)
- **Status** (`active` / `inactive`)

> `[CHANGE: ...]`

---

## 6. Service Plans Page  `/dashboard/admin/services/[id]/plans`

### Purpose
Manage pricing tiers for a single service (e.g. Basic ₹999, Premium ₹2499).

### Layout
```
←  Back to Services
HEADER: "ITR-1 Salaried — Pricing Tiers"      [+ NEW PLAN]

┌────────────────────────────────────────────────────────────┐
│ PLAN NAME │ PRICE   │ TURNAROUND │ STATUS │ DESCRIPTION    │
├────────────────────────────────────────────────────────────┤
│ Basic     │ ₹999    │ 48 Hours   │ ACTIVE │ Quick filing   │
│ Premium   │ ₹2,499  │ 24 Hours   │ ACTIVE │ Expert review  │
└────────────────────────────────────────────────────────────┘
```

### Actions
| Action | Trigger | API |
|--------|---------|-----|
| Create plan | `+ NEW PLAN` modal | `POST /api/admin/services/[id]/plans` |
| Edit plan | ✎ icon | `PATCH /api/admin/service-plans/[id]` |
| Delete plan | 🗑 icon (blocked if used in active requests) | `DELETE /api/admin/service-plans/[id]` |

### Plan fields
- **Plan Name** (required)
- **Price (₹)** (positive number)
- **Turnaround Time** (free-text, e.g. "48 Hours")
- **Description** (optional)

> `[CHANGE: ...]`

---

## 7. Service Requests Page  `/dashboard/admin/service-requests`

### Purpose
Operational lifecycle tracking of every taxpayer service request with SLA monitoring.

### Layout
```
HEADER: "Service Requests"           [⬇ EXPORT CSV]  [⬆ IMPORT →]
        Tracking 6 taxpayer requests across all statuses

[ 🔍 Search by ID, name, email or service... ]    [▼ All Statuses]

┌─────────────────────────────────────────────────────────────────────────────┐
│ TAXPAYER       │ SERVICE       │ STATUS       │ AMOUNT │ SLA       │ REG'D  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ABC123         │ ITR-1 Salaried│ PAYMENT_PEND │ ₹999   │ 12h OK    │ 6 Jun  │
│ Test Customer  │ Basic         │              │ ○ Pend │           │        │
│ tc@taxkosh.in  │               │              │        │           │        │
├─────────────────────────────────────────────────────────────────────────────┤
│ DEF456         │ Corp. Audit   │ COMPLETED    │ ₹5,000 │ 5h OK     │ 5 Jun  │
│ Auto User      │ Standard      │              │ ● Paid │           │        │
└─────────────────────────────────────────────────────────────────────────────┘

Page 1 of N · 6 total requests              [ ← 1 2 3 → ]
```

### SLA Status legend
- ● **Healthy** (gray) — within 75% of SLA window
- ⚠ **Warning** (amber) — past 75% of SLA window
- ⚠ **Critical** (red, animated) — past SLA window (breach)
- _SLA clock starts at PAID status._

### Actions
| Action | Trigger | API |
|--------|---------|-----|
| Filter by status | Status dropdown | `GET ?status=X` |
| Search | Search input (client-side) | — |
| Open detail | Row click / chevron | navigates to `/dashboard/admin/service-requests/[id]` |
| Export | `EXPORT CSV` | Generates CSV client-side |
| Import | `IMPORT` | Navigates to Bulk Import |

> `[CHANGE: ...]`

---

## 8. Service Request Detail  `/dashboard/admin/service-requests/[id]`

### Purpose
Single-pane operational console for one request — manage status, documents, communication, filing.

### Layout
```
←  Back to Service Requests
HEADER: "ITR-1 Salaried"   [ID: ABC12345]      [⏱ 12h Temporal Lag]
        Operational status: PAYMENT_PENDING

⚠ Prerequisite Deficit
   Awaiting mandatory artifacts: Form 16, PAN Card

┌─────────────────────────────────────────┬─────────────────────────┐
│ LEFT (2 cols)                           │ RIGHT (1 col)           │
├─────────────────────────────────────────┼─────────────────────────┤
│                                         │                         │
│ ┌─ Identity ────┐  ┌─ Service ─────┐   │ ┌─ LIFECYCLE CONTROL ─┐ │
│ │ Name: ...     │  │ Plan: Basic   │   │ │ 01 Request Docs    →│ │
│ │ Email: ...    │  │ Amount: ₹999  │   │ │ 02 Commence Ops    →│ │
│ │ PAN: AB***F   │  │ Date: 6 Jun   │   │ │ 03 Query Client    ✉│ │
│ └───────────────┘  └───────────────┘   │ │ 04 Pre-Filing Chk  ✓│ │
│                                         │ │ [Seal & Upload]    ⚡│ │
│ ┌─ CREDENTIAL VAULT ────────────────┐  │ │ ─────────────────── │ │
│ │  Form 16     [✓ uploaded] [eye][⬇]│  │ │ Systemic Rejection ⚠│ │
│ │  PAN Card    [○ pending]          │  │ └─────────────────────┘ │
│ │  Bank Stmt   [○ pending]          │  │                         │
│ │                  [+ Inject Artifact]│  │ ┌─ INTERNAL COMMS ────┐│
│ └────────────────────────────────────┘ │ │ (real-time feed of   ││
│                                         │ │  internal notes per   ││
│ ┌─ OPERATIONAL FINALITY (when FILED) ┐ │ │  request)             ││
│ │ ✓ Compliance artifact anchored.    │ │ │                       ││
│ │           [Retrieve Filing Ack ⬇] │ │ └───────────────────────┘│
│ └────────────────────────────────────┘ │                         │
└─────────────────────────────────────────┴─────────────────────────┘
```

### State transitions (lifecycle buttons)
1. `Request Docs` → status = `DOCUMENTS_PENDING`
2. `Commence Ops` → status = `UNDER_PROCESS` *(blocked if mandatory docs missing)*
3. `Query Client` → opens prompt → `POST /clarification` → status = `CLARIFICATION_REQUIRED`
4. `Pre-Filing Check` → status = `READY_FOR_FILING`
5. `Seal & Upload` → file picker → uploads filing acknowledgement → status = `FILED`
6. `Systemic Rejection` → status = `REJECTED`

### Actions
| Action | API |
|--------|-----|
| Status update | `PATCH /api/admin/service-requests/[id]` |
| Send clarification | `POST /api/admin/service-requests/[id]/clarification` |
| Upload supplementary doc | `POST /api/admin/service-requests/[id]/document` |
| Upload filing acknowledgement | `POST /api/admin/service-requests/[id]/file` |
| Add internal note | `POST /api/admin/service-requests/[id]/notes` |
| Assign to team member | `POST /api/admin/service-requests/[id]/assign` |

> `[CHANGE: ...]`

---

## 9. Customers Page  `/dashboard/admin/customers`  *(Taxpayer Registry)*

### Layout
```
HEADER: "Taxpayer Registry"                      [⬇ EXPORT CSV]
        11 verified individual and corporate taxpayers

[ 🔍 Search by name or email... ]        [▼ All Roles]

┌────────────────────────────────────────────────────────────────────┐
│ TAXPAYER       │ ROLE      │ VERIFICATION │ REQUESTS │ JOINED      │
├────────────────────────────────────────────────────────────────────┤
│ [A] Admin      │ ADMIN     │ ● Verified   │ 0        │ 6 Jun 2026 │
│   admin@...    │           │              │          │             │
│ [J] Jane Doe   │ INDIVIDUAL│ ● Verified   │ 3        │ 5 Jun 2026 │
└────────────────────────────────────────────────────────────────────┘
                                              Page 1 of N · 11 total
```

### Actions
- 🔍 Search: filters by name/email (server-side)
- Filter by role: INDIVIDUAL / BUSINESS / CA
- Click chevron → opens `/dashboard/admin/customers/[id]`
- `EXPORT CSV` → downloads up to 5000 customers

> `[CHANGE: ...]`

---

## 10. Customer Detail  `/dashboard/admin/customers/[id]`

### Layout
```
←  Back
HEADER: "Jane Doe"
        jane@example.com

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Reqs   │ Completed    │ Documents    │ Total Spend  │
│   3          │   2          │   8          │  ₹4,997      │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌──────────────────┐  ┌──────────────────────────────────────────────┐
│ PROFILE          │  │ SERVICE REQUESTS (last 20)                   │
├──────────────────┤  ├──────────────────────────────────────────────┤
│ Role: INDIVIDUAL │  │ ABC12345  ITR-1 Salaried     PAID            │
│ PAN: AB***F      │  │           6 Jun · ₹999                       │
│ Phone: —         │  │                                              │
│ GSTIN: —         │  │ DEF67890  GSTR Monthly       COMPLETED       │
│ Email: Verified  │  │           5 Jun · ₹999                       │
│ Joined: ...      │  │ ...                                          │
└──────────────────┘  └──────────────────────────────────────────────┘
```

### Actions
- Hover row → ◀ icon → opens that service request

> `[CHANGE: ...]`

---

## 11. Bulk Import Page  `/dashboard/admin/import`

### Layout (empty state)
```
←  Back
HEADER: "Bulk Import"
        Import taxpayers from a CSV file. Existing accounts are skipped.

  ┌─────────────────── (dashed drop zone) ─────────────────────┐
  │                                                             │
  │                      ⬆ (icon)                              │
  │                                                             │
  │              Drop your CSV here                            │
  │   or click to browse. Required columns: email              │
  │   Optional: name, phone, pan, gstin, role                  │
  │                                                             │
  │              [⬇ DOWNLOAD TEMPLATE]                         │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

### Layout (after CSV parsed)
```
📁 my-customers.csv  ·  50 rows · 48 valid · 2 invalid    [Reset]  [Import 48 →]

⚠ 2 rows will be skipped due to validation errors

┌────────────────────────────────────────────────────────┐
│ ✓ │ Name        │ Email           │ Phone │ PAN │ Role │
├────────────────────────────────────────────────────────┤
│ ✓ │ Ravi Kumar  │ ravi@...        │ 98... │ ABC..│ IND │
│ ✗ │ Bad Email   │ invalid         │       │      │ IND │  Invalid email
└────────────────────────────────────────────────────────┘
```

### Layout (after import)
```
┌──────────────┬──────────────────┬──────────────┐
│ ✓ Created    │ ⚠ Skipped (existing) │ ✗ Errors │
│   48         │   2                  │   0      │
└──────────────┴──────────────────┴──────────────┘

[Import Another File]   [View Taxpayer Registry →]
```

### Validation rules
- **Email** required, must be valid format
- **PAN** optional, must match `^[A-Z]{5}[0-9]{4}[A-Z]$`
- **Phone** optional, 10 digits when normalized
- **Role** defaults to `INDIVIDUAL` if blank, otherwise must be `INDIVIDUAL` / `BUSINESS` / `CA`
- Max 500 rows per import

### Default password
Imported users get `TaxKosh@ChangeMe1` and must reset via "Forgot Password" link.

> `[CHANGE: ...]`

---

## 12. Audit Logs Page  `/dashboard/admin/audit-logs`

### Purpose
Forensic log of every compliance-sensitive event.

### Layout
```
HEADER: "Audit Logs"

[▼ Filter by Action]  [Search by user...]

┌─────────────────────────────────────────────────────────────────────────┐
│ TIMESTAMP        │ ACTION              │ USER         │ ENTITY    │ IP  │
├─────────────────────────────────────────────────────────────────────────┤
│ 6 Jun · 14:23:09 │ LOGIN               │ Admin        │ —         │ ::1 │
│ 6 Jun · 14:21:02 │ DOCUMENT_VIEW       │ Jane Doe     │ doc_abc12 │ ... │
│ 6 Jun · 14:18:55 │ PAYMENT_SUCCESS     │ Jane Doe     │ sr_ABC123 │ ... │
└─────────────────────────────────────────────────────────────────────────┘
                                                  Page 1 of N · 50 per page
```

### Actions logged
- `LOGIN`, `LOGOUT`, `PASSWORD_CHANGE`
- `DATA_EXPORT`, `DOCUMENT_UPLOAD`, `DOCUMENT_VIEW`
- `PAYMENT_INITIATED`, `PAYMENT_SUCCESS`
- `PROFILE_UPDATE`, `SENSITIVE_DATA_ACCESS`
- `ITR_SUBMISSION`

### Filters
- Action (multi-select dropdown)
- User ID (text)
- Date range *(not yet implemented — `[CHANGE: add date range filter?]`)*

> `[CHANGE: ...]`

---

## 13. Settings Page  `/dashboard/admin/settings`

### Purpose
Team management and system flags.

### Current sections (placeholders)
- **Team Members** — list of admin/CA/tax-executive users
- **Feature Flags** — toggle experimental features
- **System Health** — DB connection, S3 connection, last cron run

> `[CHANGE: tell me what settings you actually want exposed here]`

---

## 14. Cross-cutting Patterns

### Auth & RBAC
- Every admin page is wrapped by `app/dashboard/admin/layout.tsx` which calls `auth()` server-side and redirects non-admins to `/dashboard`.
- Every admin API route uses `requireAdmin()` from `lib/api-auth.ts` (single source of truth).
- `proxy.ts` middleware adds a second layer: any `/dashboard/admin/*` URL hit without ADMIN role goes to `/unauthorized`.

### Visual design
- Dark sidebar, light main area
- Border-less cards with `shadow-2xl shadow-slate-200/50` and `rounded-[2.5rem]`
- Font: Inter, with `font-black uppercase tracking-widest` micro-labels
- Status badges use soft tints: `bg-{color}-500/10 text-{color}-600 border-{color}-500/20`
- All animations are `transition-all duration-500` cubic-bezier

### Error states & loading
- Loading: 12×12 spinner with `border-4 border-primary/20 border-t-primary animate-spin`
- Empty: 20×20 icon at 30% opacity + uppercase "No data" label
- Errors: surfaced via `sonner` toasts (top-right)

### Pagination
- Server-driven (`page` + `limit` query params) on Service Requests, Customers, Audit Logs
- UI: `[← 1 2 3 →]` buttons + "Page X of N" caption
- Default limit: 25–50 depending on density

### CSV Export
- Available on: Service Requests, Customers
- Fetches up to 1000–5000 rows, builds CSV client-side, triggers download
- File name: `taxkosh-{type}-{YYYY-MM-DD}.csv`

---

## 15. Data Model Reference

```
Category (Level 1)
  └─ SubCategory (Level 2)
       └─ Service (Level 3)
            └─ ServicePlan (pricing tier)
                 └─ ServiceRequest (one customer purchase)
                      ├─ Document[] (uploaded by customer or admin)
                      ├─ InternalNote[] (admin-only communication)
                      └─ PlatformInvoice (generated on PAID status)
```

---

## 16. Open Questions / Future Work

- [ ] Date range filter on Audit Logs?
- [ ] Bulk operations on Service Requests (mark multiple as `READY_FOR_FILING`)?
- [ ] Email templates editor in Settings?
- [ ] Razorpay payout reconciliation view?
- [ ] Notification preferences (which events email admin)?
- [ ] CA/Tax Executive role permissions (currently all admin)?

> `[CHANGE: tick what you want, strike what you don't]`

---

## Review Workflow

1. Read this document end-to-end.
2. For every screen / action you want changed, write `[CHANGE: what you want]` inline.
3. For new features, add a bullet under "Open Questions" or write a new section.
4. Hand the file back. I'll process every change in one batch and report on what was done.
