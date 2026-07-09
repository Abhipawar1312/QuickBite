# Project Summary — Online Food Website (Detailed, Copy-Paste Ready)

Purpose: a complete summary of the project's architecture, libraries, important files, runtime behavior, and operational notes — suitable to paste into another AI (ChatGPT, Claude, etc.) to generate interview questions, study notes, or practice answers.

---

## 1) One-line elevator pitch

Full-stack food-ordering web application: restaurants and menus browsing, cart and checkout with Stripe, admin CRUD for restaurants/menus, user auth with email verification, image uploads via Cloudinary, and persisted client-side cart state using Zustand.

---

## 2) High-level architecture

- Backend: Node.js + Express (TypeScript) exposing a REST API. Uses Mongoose to model domain data in MongoDB.
- Frontend: React + Vite + TypeScript. State is managed with Zustand (persist middleware) and HTTP calls use axios with credentials enabled.
- Integrations: Stripe Checkout + webhooks for payments, Cloudinary for image hosting, SendGrid / Nodemailer / Mailtrap for email flows.
- Deployment model: typical split deployment — static frontend on CDN (Vercel/Netlify) and backend on Node host (container, Heroku, or VM). HTTPS required for secure cookies and Stripe.

---

## 3) Why each major technology is used (concise rationale)

- Node.js + Express: fast to bootstrap REST APIs, huge middleware ecosystem, works well with TypeScript.
- MongoDB + Mongoose: flexible document schema fits menus/orders; Mongoose provides schema-level validation and population utilities.
- Stripe: easy Checkout flow with hosted UI (reduces PCI scope) and secure webhook events for payment confirmation.
- Cloudinary: CDN-backed image storage with on-the-fly transformations to serve optimized images.
- SendGrid / Nodemailer / Mailtrap: production and development email delivery; Mailtrap used locally to inspect email templates.
- React + Vite + TypeScript: modern front-end stack with fast HMR and type-safety.
- Zustand: minimal global-state solution with a simple API and `persist` middleware to keep cart/user state in localStorage.

---

## 4) Core features and user flows

- User sign up / verify email / login / forgot password / reset password.
- Browse restaurants and menus, search and filter menus, add items to cart.
- Cart persisted in browser across reloads (Zustand persist + localStorage).
- Pre-create Order snapshot on the backend, create Stripe Checkout session, redirect to Stripe.
- Stripe webhook verifies payment and marks order `paid` or updates status.
- Admin UI to create/edit/delete restaurants and menu items, including image uploads.

---

## 5) Important backend files & responsibilities

- `Backend/index.ts` — app bootstrap, middleware registration, route mounting, Stripe webhook endpoint.
- `Backend/db/connectDB.ts` — MongoDB connection and connection options.
- `Backend/controller/user.controller.ts` — signup/login, verification, password reset logic, token handling.
- `Backend/controller/menu.controller.ts` — create/read/update/delete for menu items, image upload handling.
- `Backend/controller/order.controller.ts` — pre-create order snapshots, create Stripe session, webhook handler to finalize orders.
- `Backend/controller/restaurant.controller.ts` — restaurant CRUD and relations with menus.
- `Backend/models/*.ts` — Mongoose schemas for `User`, `Menu`, `Restaurant`, `Order` (orders include snapshot fields such as priceAtPurchase).
- `Backend/middlewares/isAuthenticated.ts` — reads JWT cookie, verifies token, attaches `req.id` or `req.user`.
- `Backend/middlewares/multer.ts` — multer memory storage config for handling multipart uploads.
- `Backend/utils/cloudinary.ts` & `Backend/utils/imageUpload.ts` — Cloudinary config, upload helpers, and data-URI conversion.
- `Backend/utils/generateToken.ts` — JWT creation and cookie options (expiry, secure flags).
- `Backend/utils/sendgrid.ts` & `Backend/mailtrap/htmlEmail.ts` — email templates and send functions for production and dev.

---

## 6) Important frontend files & responsibilities

- `Frontend/src/main.tsx` and `Frontend/src/App.tsx` — app entry, router, providers (theme, stores).
- `Frontend/src/store/*` — Zustand stores: `useUserStore.ts`, `useCartStore.ts`, `useMenuStore.ts`, `useOrderStore.ts`, `useRestaurantStore.ts` (state shape, actions, and persistence).
- `Frontend/src/auth/*` — components/pages for Signup, Login, VerifyEmail, ForgetPassword, ResetPassword.
- `Frontend/src/admin/*` — admin pages (`AddMenu.tsx`, `EditMenu.tsx`) demonstrating FormData uploads.
- `Frontend/src/components/*` — `AvailableMenu`, `Cart`, `CheckoutConfirmPage`, `RestaurantDetail`, `Profile` — main UI building blocks.

---

## 7) Key design patterns & reasoning

- Cookie-based JWT auth: avoids storing tokens in localStorage and works with browser cookies; requires `httpOnly`, `secure` and correct `sameSite` in prod.
- Order snapshot pattern: store immutable pricing and item details in the Order document at checkout time to protect historical data.
- Pre-create Order + Stripe session: allows mapping webhook events to DB orders using session metadata and tracking abandoned carts.
- Server-side image upload (multer memory → Cloudinary): easy to implement and centralizes transformations; trade-off is server bandwidth and memory.
- Persisted client-side state (Zustand): simple UX for cart persistence without heavy client-state boilerplate.

---

## 8) Security & production hardening checklist

- Use `secure: true` and `sameSite: 'none'` for cookies in production behind HTTPS.
- Verify Stripe `stripe-signature` in webhook handlers using `STRIPE_WEBHOOK_SECRET`.
- Rate-limit auth endpoints (`/signup`, `/login`, `/forgot-password`) and consider CAPTCHA for abuse.
- Validate uploaded files by MIME type and maximum size; reject suspicious payloads.
- Hash sensitive tokens (password reset) before storing and set short expirations.
- Use environment variables for secrets and keep an `env.example` in repo.
- Add structured logging (winston) and error monitoring (Sentry) for production observability.

---

## 9) Environment variables (expected)

- `MONGO_URI` — MongoDB connection string
- `PORT` — Backend port
- `JWT_SECRET` — JWT signing secret
- `JWT_EXPIRES_IN` — JWT lifetime
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary keys
- `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET` — Stripe API and webhook signing secrets
- `SENDGRID_API_KEY` or SMTP / `MAILTRAP_*` credentials — Email delivery

---

## 10) Developer commands (local run)

Backend:

```powershell
cd Backend
npm install
npm run dev
```

Frontend:

```powershell
cd Frontend
npm install
npm run dev
```

Testing (frontend):

```powershell
cd Frontend
npm run test
```

---

## 11) Testing recommendations

- Backend: unit tests for controllers and models; integration tests for routes using an in-memory MongoDB (mongodb-memory-server) or a test database.
- Frontend: Jest + React Testing Library for components; mock network calls with msw or jest mocks.
- Mock external services (Stripe, Cloudinary, SendGrid) in CI to avoid flakiness and cost.

---

## 12) Operational considerations

- Webhook reliability: log raw webhook payloads and use idempotency checks for Stripe event IDs.
- Reconciliation job: periodic job comparing DB orders with Stripe to detect missed webhooks.
- Cleanup: garbage collect stale pre-created orders after a reasonable TTL.
- Backups: schedule MongoDB backups and store them offsite.

---

## 13) Short interview-prep prompt (paste into another AI)

Use this exact prompt to generate interview questions and answers tailored to this repo:

"I have a fullstack project (Node/Express backend with MongoDB and Mongoose; React + Vite frontend using Zustand). The backend provides cookie-based JWT auth, image uploads via multer memory storage to Cloudinary, email flows using SendGrid/Nodemailer/Mailtrap, Stripe Checkout payment flows with a pre-created Order snapshot and webhook verification. The frontend uses React + TypeScript, Zustand with `persist` middleware for cart and user state, and axios with `withCredentials = true`.

Generate 25 interview-level questions with short (2–4 sentence) answers and a deeper explanation (3–6 bullet points) for each question. Cover architecture, authentication and cookie security, Stripe Checkout and webhooks (verification and idempotency), image upload trade-offs (server upload vs signed direct upload), Mongoose modeling decisions (snapshots vs references), state management with Zustand, testing strategies, and production hardening steps. Also include follow-up questions an interviewer might ask."

---

## 14) Quick copy-paste study bullets

- Cookie JWT vs Bearer token: cookies are automatically sent by browsers; enforce `httpOnly`, `secure`, and `sameSite` properly.
- Pre-create Order: snapshot item prices at checkout; attach `orderId` to Stripe session metadata to correlate webhooks.
- Mongoose snapshots: store `priceAtPurchase` in orders to prevent historical data changes when menu prices update.
- Cloudinary server upload trade-offs: fast to implement, but consider presigned client uploads for scale.
- Stripe webhooks: always validate signature and implement idempotency checks for reliable processing.

---

If you want, I can now also:

- Generate `INTERVIEW_PREP.md` with the full 25 Q&A and save it to the repo.
- Create a condensed one-page flashcard file.

Tell me which of those to create next and I'll add it and update the todo list.

Generated on: 2026-04-21
