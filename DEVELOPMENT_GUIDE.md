# KamerSite Development Guide

This explains how the four of us work on KamerSite together: who owns
what, how our work depends on each other, and the Git/testing/UML/report
process. Read this before you start a task.

**Important:** ownership below means "primary responsibility," not "only
this person can touch this file." Any of us can edit any file when
integration requires it — see the Shared Files note at the end.

## 1. Feature ownership

| | Member 1 | Member 2 | Member 3 | Member 4 |
|---|---|---|---|---|
| **Feature area** | Authentication + Profile | Places + Search + Categories | Reviews + Favorites | Admin Management |
| **Frontend pages** | `auth.html`, `profile.html` | `index.html`, `explore.html`, `place.html` | `place.html`, `profile.html` (shared) | `admin.html` |
| **CSS** | `auth.css`, `profile.css` | `home.css`, `explore.css`, `place.css` | — | `admin.css` |
| **JS** | `auth.js`, `profile.js` | `main.js`, `explore.js`, `place.js` | `place.js`, `profile.js` (shared) | `admin.js` |
| **Backend models** | `User.js` | `Place.js`, `Category.js` | `Review.js`, `Favorite.js` | — (uses existing models) |
| **Backend API** | `api/auth.js`, `middleware/auth.js` | `api/places.js`, `api/categories.js` | `api/reviews.js`, `api/favorites.js` | `api/admin.js` |
| **Tests** | `auth.test.js` | `places.test.js`, `categories.test.js` | `reviews.test.js`, `favorites.test.js` | `admin.test.js` |
| **UML** | Login sequence | Search Places sequence | Add Favorite + Submit Review sequences | Admin Moderates Review sequence |
| **Report sections** | Introduction, problem statement, aim, objectives, authentication/security | Tourism discovery literature, place discovery requirements, UI screenshots | Database concepts, user interaction requirements, database design, class diagram | Testing methodology, test cases/results, deployment, challenges, conclusion |

Every model has exactly **one** owner. If your feature needs data from a
model you don't own (e.g. Member 4's admin dashboard needs `Place.js`),
you use that model — you don't create a second one.

## 2. Feature dependencies

```
DATABASE (everyone, Phase 1)
   │
   ├─────────────┐
   ↓             ↓
AUTHENTICATION  PLACES
 (Member 1)    (Member 2)
   │             │
   └──────┬──────┘
          ↓
  REVIEWS/FAVORITES
     (Member 3)
          │
          ↓
        ADMIN
     (Member 4)
```

This is a **dependency** order, not an importance order. Reviews/Favorites
need a logged-in user (Member 1) and a place to attach to (Member 2), so
Member 3 can't fully finish until those exist — but Member 3 can (and
should) start early using mock data, per Phase 2 below.

## 3. Working in parallel

Because of the dependency chain, work like this:

- **Phase 1 (everyone together):** repo setup, MongoDB connection, models,
  Express skeleton, agree on API response shapes.
- **Phase 2 (parallel, with mocks where needed):** Members 1 and 2 build
  their real features. Members 3 and 4 build their frontend pages against
  **mock data** (hardcoded JS arrays standing in for API responses) so
  they're not blocked, then swap the mock data for real `apiFetch()` calls
  once Members 1/2's APIs are ready.
- **Phase 3:** everyone connects their frontend to their real API.
- **Phase 4/5:** integrate the full user flow, then the full admin flow.
- **Phase 6:** everyone tests their own feature, then swaps and tests a
  teammate's feature (fresh eyes catch different bugs).
- **Phase 7:** everyone contributes to deployment, the report, and the
  final presentation.

## 4. Git workflow

Branches:

```
main
feature/auth-profile        (Member 1)
feature/place-discovery     (Member 2)
feature/reviews-favorites   (Member 3)
feature/admin-management    (Member 4)
```

Never push directly to `main`.

1. Pick a task from the project board
2. Branch off `main`
3. Implement it
4. Test it locally
5. Commit — **every commit must represent real work**, don't pad the
   history with empty commits to look active
6. Push your branch
7. Open a Pull Request into `main`
8. Get it reviewed (see rotation below)
9. Fix anything the reviewer flags
10. Merge
11. Pull `main` and run the integration/test checklist again

### Commit message format

```
feat(auth): implement user registration
feat(profile): implement user profile
feat(places): implement place discovery API
feat(explore): implement search and filtering
feat(reviews): implement review submission
feat(favorites): implement save and remove favorite
feat(admin): implement review moderation
test(auth): add authentication tests
fix(places): improve search validation
docs(uml): update search places sequence diagram
```

### Code review rotation

```
Member 1 → reviews Member 2's PRs
Member 2 → reviews Member 3's PRs
Member 3 → reviews Member 4's PRs
Member 4 → reviews Member 1's PRs
```

Everyone reviews and everyone gets reviewed.

## 5. Task board

Use a GitHub Project board with columns: **Backlog → Ready → In Progress →
Code Review → Testing → Done**.

Break big features into small, checkable tasks. Instead of one card
"Build Places," use separate cards: Create Place model, Create Category
model, Build places API, Build categories API, Implement search,
Implement category filtering, Implement nearby places, Connect Explore
page, Connect Place Details page, Write places tests, Write categories
tests.

## 6. Testing responsibilities

Each member writes tests for their own API files (see the ownership table
above). Minimum coverage expected per area:

- **Auth:** registration, duplicate email, invalid login, valid login,
  protected routes reject missing/invalid tokens
- **Places:** list, get one, search, filtering (combined), invalid/missing
  place returns 404
- **Categories:** list, create/update/delete (admin only), delete blocked
  when places depend on it
- **Favorites:** add, duplicate prevented, remove, unauthorized access
  rejected
- **Reviews:** submit (starts pending), validation (rating 1–5, no
  duplicate review per user/place), approved review affects rating,
  rejected review doesn't
- **Admin:** non-admin gets 403 on every admin-protected route, admin gets
  200, dashboard stats match the real database

Run `npm test` before opening any PR that touches the backend. See
`backend/tests/README.md` for how the test database works.

Beyond automated tests, do a manual **integration testing checklist**
together in Phase 6: click through the full Visitor → Registered User →
Admin flow described in the README, on both desktop and mobile widths.

## 7. UML responsibilities

See `docs/uml/README.md` for the file list and how to render them. Rule of
thumb: whoever builds a feature keeps its diagram accurate. If you change
an endpoint or a model field, check whether a diagram needs updating in
the same PR.

## 8. Report responsibilities

Each member writes the sections tied to their feature area (see the
ownership table). Compile into one final report — don't submit four
separate documents.

## 9. Shared files

These files don't belong to one member — anyone can edit them when their
feature needs it, but avoid unnecessary changes since everyone depends on
them:

- `backend/app.js`, `backend/server.js`
- `backend/package.json`, `backend/package-lock.json`
- `frontend/css/style.css`
- `README.md`, `.gitignore`, `.env.example`

If you need to change one of these in a non-trivial way, mention it in
your PR description so the others notice.

## 10. Keep it simple

This is a university project, not a production system. 
