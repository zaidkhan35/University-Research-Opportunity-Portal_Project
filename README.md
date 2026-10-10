# University Research Opportunity Portal

A web app where faculty post research opportunities and students can view them.
Backend: FastAPI + SQLAlchemy + MySQL. Frontend: HTML, CSS, JavaScript.

**Student:** YOUR NAME
**Roll No:** YOUR ROLL NUMBER
**Demo video:** PASTE-YOUR-GOOGLE-DRIVE-LINK-HERE

## Features
- Create, view, update, close and delete research opportunities
- Input validation (400 error with a list of problems)
- 404 error when an opportunity does not exist
- Postman collection with automatic tests

## Project structure
```
backend/     FastAPI app (main.py, models.py, schemas.py, database.py, config.py)
frontend/    index.html, Style.css, script.js
database/    schema.sql
postman/     collection JSON + screenshots
```

## Setup

1. Start **MySQL** in XAMPP.
2. Create the database and tables: import `database/schema.sql` (phpMyAdmin or MySQL CLI). Database name: `research_portal`.
3. Install the backend:
   ```
   cd backend
   python -m venv myenv
   myenv\Scripts\activate
   pip install -r requirements.txt
   ```
4. Create a `.env` file in `backend/` with your database settings (see `config.py` for the names). Do not commit this file.
5. Run the server:
   ```
   uvicorn main:app --reload
   ```
   Open http://127.0.0.1:8000/docs to see the API docs.
6. Run the frontend: open `frontend/index.html` in the browser (the backend must be running).

## API

Base URL: `http://127.0.0.1:8000/api/opportunities`

| Method | Path | What it does | Success |
|---|---|---|---|
| POST | `/api/opportunities` | Create an opportunity | 201 |
| GET | `/api/opportunities` | List all opportunities | 200 |
| GET | `/api/opportunities/{id}` | Get one opportunity | 200 |
| PUT | `/api/opportunities/{id}` | Update (also used to set status to Closed) | 200 |
| DELETE | `/api/opportunities/{id}` | Delete an opportunity | 200 |

Errors:
- `400` validation failed (response has an `errors` list)
- `404` opportunity not found

### Example body (POST / PUT)
```json
{
  "title": "AI Based Plant Disease Detection",
  "description": "Build a deep learning model that finds leaf diseases from photos.",
  "research_area": "Machine Learning",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, TensorFlow, OpenCV",
  "available_positions": 3,
  "application_deadline": "2027-03-31",
  "status": "Open"
}
```

## Testing with Postman
1. Open Postman and import `postman/research_portal_collection.json`.
2. Make sure the backend and MySQL are running.
3. Send the requests in order, or right-click the collection and choose **Run collection**.
4. Screenshots of each request and response are in `postman/screenshots/`.

Requests covered: create (3 times), get all, get one, update, open to closed, delete, 404 after delete, validation error (400).


