# LetsMeet 📅✨

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://berkaycakaroglu.github.io/letsmeet/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Live Interactive Demo:** [https://berkaycakaroglu.github.io/letsmeet/](https://berkaycakaroglu.github.io/letsmeet/)

LetsMeet is an intelligent collaborative calendar and group scheduling web application designed to eliminate the friction of finding common meeting times in teams and friend circles. The platform analyzes the 24-hour timelines of all group members to automatically identify overlapping free time slots without revealing any private event details. Group members can propose events directly within these identified slots; once approved, events automatically sync to everyone's individual calendars.

---

## ✨ Features

* **Automated 24-Hour Scheduling:** Instantly calculates overlapping free slots across all members of a group.
* **Privacy-First Design:** Individual plan titles and details remain private; only busy blocks are evaluated.
* **Integrated Polling & Proposals:** Propose meetups directly within suggested slots; approved proposals sync to personal calendars automatically.
* **Social Connections:** Username-based friend requests, instant accept/decline workflows, and unique group invite codes.
* **Secure Authentication:** Bcrypt password hashing and stateless JWT-based session authorization.
* **Live Environmental Context:** Live digital clock and Open-Meteo weather integrations based on GPS or manual city selection.

---

## 🧠 Core Architecture & Scheduling Logic

* **Intersection Algorithm:** Aggregates individual busy time blocks within a 24-hour window and calculates the mathematical complement to extract 100% available common time slots across multiple users.
* **Zero-Knowledge Privacy:** Members only see aggregated availability slots (e.g., `14:00 - 16:30 (Available)`); private event titles, descriptions, and categories remain completely hidden from group members.

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, Lucide React, Framer Motion, CSS Design System
* **Backend:** Python, FastAPI, SQLAlchemy, Pydantic, Bcrypt, PyJWT
* **Database:** MySQL
* **Deployment:** Git, GitHub Pages

---

## 🔌 API Reference & Interactive Docs

Once the backend is running, access the interactive Swagger API documentation at `http://127.0.0.1:8000/docs`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT bearer token |
| `GET` | `/api/users/events` | Fetch authenticated user's calendar events |
| `GET` | `/api/groups/{id}/common-slots` | Calculate overlapping free slots for a specific date |
| `POST` | `/api/groups/propose-plan` | Propose a group event within a matched time slot |
| `POST` | `/api/groups/respond-proposal` | Vote (accept/decline) on an incoming meetup proposal |

---

## 📁 Project Structure

```text
letsmeet/
├── app.py                 # FastAPI core, endpoints and scheduling engine
├── app_database.py        # SQLAlchemy database engine and session configuration
├── models.py              # Database models (Users, Groups, Events, Proposals)
├── schemas.py             # Pydantic request and response schemas
├── security.py            # Bcrypt hashing and JWT authorization
└── letsmeet-frontend/     # React + Vite frontend application
```

---

## 🚀 Installation and Setup

### Prerequisites

* Python 3.10+
* Node.js 18+ and npm
* MySQL Server

### 1. Backend Setup

```bash
# Clone the repository
git clone [https://github.com/berkaycakaroglu/letsmeet.git](https://github.com/berkaycakaroglu/letsmeet.git)
cd letsmeet

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS / Linux:
# source venv/bin/activate

# Install backend dependencies
pip install fastapi uvicorn sqlalchemy pymysql python-dotenv bcrypt pyjwt pydantic cryptography

# Create a .env file in the root directory:
# DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/letsmeet_db
# JWT_SECRET_KEY=your_secure_random_jwt_secret_key
# JWT_ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=1440
# CORS_ORIGINS=http://localhost:5173,[http://127.0.0.1:5173](http://127.0.0.1:5173)

# Start the FastAPI backend server
uvicorn app:app --reload
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd letsmeet-frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🔮 Future Roadmap

- [ ] **AI-Powered Venue Recommendations:** Integrate Google Places / Foursquare API with an LLM reasoning engine to suggest top 3 meetup spots tailored to group budget and location.
- [ ] **Multi-Slot Polling:** Allow proposing multiple alternative time options with group voting (When2meet / Doodle style).
- [ ] **Calendar Interoperability:** Google Calendar & Apple Calendar `.ics` sync and export.
- [ ] **Recurring Events:** Support for weekly recurring schedules (lectures, recurring team standups).
- [ ] **In-App & Push Notifications:** Real-time alerts for incoming group invites and proposal responses via WebSockets/PWA.

---

## 📄 License

This project is licensed under the MIT License.
