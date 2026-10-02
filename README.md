🌍 KamerSite
Discover Places. Explore Cameroon.

KamerSite is a web application for discovering and exploring interesting places in Cameroon, starting with Yaoundé.

The platform provides users with an accessible way to discover local destinations, browse places by category, search and filter destinations, view detailed information, save favorites, and share reviews.

📌 About the Project

Finding information about local destinations in Cameroon can be difficult when information is spread across different platforms.

KamerSite aims to provide a centralized platform where users can easily discover and explore places in Cameroon.

The project is developed as a university software development project at ICT University.

🎯 Objectives

Help users discover interesting places in Cameroon

Organize destinations into categories

Provide useful information about local destinations

Make searching and exploring places easier

Allow users to save favorite destinations

Allow users to share and view reviews

Provide administrators with tools to manage platform content

Demonstrate practical full-stack web development

✨ Features
👤 Authentication & Profile

User registration

User login

Secure password handling

Protected routes

User profile management

Logout

📍 Place Discovery

Browse destinations

View place details

Search for places

Filter places by category

Discover nearby places

Explore destinations from the home and explore pages

❤️ Favorites

Add places to favorites

Remove places from favorites

View saved places

⭐ Reviews

Submit reviews

View reviews

Review validation

Review management

Administrative moderation

🛠️ Administration

Admin authentication

Admin dashboard

Manage places

Manage categories

Manage users

Moderate reviews

View platform statistics

📱 Responsive Design

KamerSite is designed to work across:

Desktop

Tablet

Mobile devices

🛠️ Technologies
Frontend

HTML5

CSS3

JavaScript

Backend

Node.js

Express.js

Database

MongoDB

Mongoose

Authentication & Security

JWT

Password hashing

Protected routes

Role-based authorization

Environment variables

Development Tools

Git

GitHub

Visual Studio Code

Postman

🏗️ System Architecture
                         USER
                           │
                           ▼
                 ┌──────────────────┐
                 │     FRONTEND     │
                 │   HTML/CSS/JS    │
                 └────────┬─────────┘
                          │
                          │ REST API
                          ▼
                 ┌──────────────────┐
                 │      BACKEND     │
                 │  Node.js/Express │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │     MONGODB      │
                 │                  │
                 │ users            │
                 │ places           │
                 │ categories       │
                 │ reviews          │
                 │ favorites        │
                 └──────────────────┘

📂 Project Structure
KamerSite/
│
├── frontend/
│   ├── index.html
│   ├── auth.html
│   ├── explore.html
│   ├── place.html
│   ├── profile.html
│   ├── admin.html
│   │
│   ├── css/
│   └── js/
│
├── backend/
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── tests/
│
├── docs/
│   └── uml/
│
├── images/
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── TEAM_STRUCTURE.md


The project structure may evolve as development progresses.

⚙️ Requirements

Before running KamerSite, make sure you have:

Node.js
 installed

MongoDB installed or access to MongoDB Atlas

Git installed

A modern web browser

A code editor such as Visual Studio Code

🚀 Installation
1. Clone the repository
git clone https://github.com/ngondoue/KamerSite.git

2. Navigate to the project
cd KamerSite

3. Install dependencies
npm install

4. Configure environment variables

Create a .env file in the project root.

Example:

PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key


Do not commit your .env file to GitHub.

5. Start the application

For development:

npm run dev


Or:

npm start


The exact command depends on the scripts configured in package.json.

🗄️ Database

KamerSite uses MongoDB.

The main collections are:

users

places

categories

reviews

favorites

The database stores users, destinations, categories, reviews, and favorite places.

🔌 API

The backend provides REST API endpoints for the main application features.

Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/users/profile
PUT  /api/users/profile

Places
GET    /api/places
GET    /api/places/:id
POST   /api/places
PUT    /api/places/:id
DELETE /api/places/:id

Categories
GET /api/categories
GET /api/categories/:id

Reviews
GET    /api/places/:id/reviews
POST   /api/places/:id/reviews
PUT    /api/reviews/:id
DELETE /api/reviews/:id

Favorites
GET    /api/favorites
POST   /api/favorites
DELETE /api/favorites/:placeId

Administration
GET    /api/admin/stats
GET    /api/admin/users
PUT    /api/admin/users/:id
PUT    /api/admin/places/:id
DELETE /api/admin/places/:id
PUT    /api/admin/reviews/:id


API endpoints may be adjusted during development as the implementation evolves.

🔐 Security

KamerSite applies basic security practices including:

Password hashing

JWT authentication

Protected routes

Role-based authorization

Input validation

Error handling

Environment variables for sensitive information

Admin access control

Sensitive credentials should never be stored directly in the source code.

🧪 Testing

Testing is performed throughout development.

The project includes testing for:

Authentication

User profiles

Places

Search

Categories

Reviews

Favorites

Administration

API functionality

Integration

Security

Responsive design

👥 Team
Member	Feature
Ngondoue Beverly	Authentication + Profile
CHEFOR SYLVANUS	Places + Search + Categories
Nfor Markbride Godlove	Reviews + Favorites
WIRSIY DAVY LEMNYUY	Administration

All team members contribute to frontend, backend, database, testing, UML, documentation, GitHub, integration, and presentation.

For detailed responsibilities, see TEAM_STRUCTURE.md.

📐 UML Documentation

The project includes UML documentation covering the major system operations:

Use Case Diagram

Class Diagram

Login Sequence Diagram

Search Places Sequence Diagram

Add Favorite Sequence Diagram

Submit Review Sequence Diagram

Admin Moderation Sequence Diagram

🗺️ Development Roadmap
Phase 1 — Foundation

 Project setup

 Backend configuration

 MongoDB connection

 Environment configuration

 Base frontend

Phase 2 — Core Features

 Authentication

 User profile

 Places

 Categories

 Search

 Filtering

Phase 3 — User Interaction

 Favorites

 Reviews

 Profile integration

Phase 4 — Administration

 Admin authentication

 Admin dashboard

 Place management

 Category management

 Review moderation

 User management

Phase 5 — Testing & Quality

 Unit testing

 API testing

 Integration testing

 Security testing

 Responsive testing

 Regression testing

 Bug fixing

Phase 6 — Finalization

 UML completion

 Documentation

 Deployment

 Final report

 Presentation

🔮 Future Improvements

Possible future improvements include:

Expansion to other cities and regions of Cameroon

Interactive maps

GPS-based place discovery

Destination ratings

Advanced recommendations

Improved image galleries

Multilingual support

Mobile application

Tourism events

Advanced administrative analytics

🎓 Academic Context

KamerSite is a university software development project developed at ICT University.

The project demonstrates practical knowledge in:

Web development

Full-stack development

Database management

REST API development

Authentication and authorization

Software testing

UML modeling

Git and GitHub collaboration

Software documentation

📄 License

This project is developed for academic and educational purposes.

👨‍💻 Contributors

Ngondoue Beverly

CHEFOR SYLVANUS

Nfor Markbride Godlove

WIRSIY DAVY LEMNYUY

🌍 KamerSite
Explore more. Discover locally.
