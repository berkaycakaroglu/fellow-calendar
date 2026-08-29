## LetsMeet

LetsMeet is an intelligent collaborative calendar and group scheduling web application designed to eliminate the friction of finding common meeting times in teams and friend circles. The platform analyzes the 24-hour timelines of all group members to automatically identify overlapping free time slots without revealing any private event details. Group members can propose events directly within these identified slots; once approved, events automatically sync to everyone's individual calendars.

## Features

* Automated 24-hour smart scheduling engine to detect overlapping free time slots
* Privacy-first timeline view keeping individual plan descriptions completely hidden
* Group meeting proposals with integrated polling and instant calendar synchronization
* Social connections via username-based friend requests and unique group invite codes
* Secure authentication with Bcrypt password hashing and JWT-based session validation
* Live clock and Open-Meteo weather context widgets based on GPS or manual city selection

## Tech Stack

* **Frontend:** React 18, Vite, Lucide React, Framer Motion, CSS Design System
* **Backend:** Python, FastAPI, SQLAlchemy, Pydantic, Bcrypt, PyJWT
* **Database:** MySQL
* **Deployment:** Git, GitHub Pages

## Project Structure

```text
letsmeet/
├── app.py                 # FastAPI core, endpoints and scheduling engine
├── app_database.py        # SQLAlchemy database engine and session configuration
├── models.py              # Database models (Users, Groups, Events, Proposals)
├── schemas.py             # Pydantic request and response schemas
├── security.py            # Bcrypt hashing and JWT authorization
└── letsmeet-frontend/     # React + Vite frontend application
```

## Installation and Setup

### Prerequisites

* Python 3.10+
* Node.js 18+ and npm
* MySQL Server

---

### 1. Backend Setup

Clone the repository:

```bash
git clone [https://github.com/berkaycakaroglu/letsmeet.git](https://github.com/berkaycakaroglu/letsmeet.git)
cd letsmeet
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment (Windows):

```bash
.\venv\Scripts\activate
```

Activate the virtual environment (macOS / Linux):

```bash
source venv/bin/activate
```

Install backend dependencies:

```bash
pip install fastapi uvicorn sqlalchemy pymysql python-dotenv bcrypt pyjwt pydantic cryptography
```

Create a `.env` configuration file in the root directory:

```env
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/letsmeet_db
JWT_SECRET_KEY=your_secure_random_jwt_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,[http://127.0.0.1:5173](http://127.0.0.1:5173)
```

Start the FastAPI backend server:

```bash
uvicorn app:app --reload
```

---

### 2. Frontend Setup

Navigate to the frontend directory:

```bash
cd letsmeet-frontend
```

Install frontend packages:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

---

## License

This project is licensed under the MIT License.