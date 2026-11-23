# Smart Courier API (FastAPI + SQLite)
    python -m venv venv && venv\Scripts\activate      (Mac/Linux: source venv/bin/activate)
    pip install -r requirements.txt
    uvicorn app.main:app --reload
API docs (try every endpoint): http://localhost:8000/docs
Demo logins: admin@smartcourier.com / admin123   |   aarav@mail.com / password123
Use PostgreSQL: set DATABASE_URL=postgresql+psycopg2://user:pw@localhost/smartcourier and pip install psycopg2-binary
Set SECRET_KEY to a long random string before any real deployment.

Live location: courier login ravi@mail.com / password123. IMPORTANT after updating: stop the server and delete smartcourier.db once so the new columns are created.

## AI features
- Chatbot: works with live data out of the box (rule-based). For the Claude-powered version set ANTHROPIC_API_KEY (optional CHAT_MODEL).
- XGBoost ETA model (optional): pip install -r requirements-ml.txt, then python ml/train_eta.py once, then restart. Without it the API uses the formula.
- Demand forecasting needs no extra packages (Holt-Winters, plain Python).
