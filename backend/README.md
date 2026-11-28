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

## Email, SMS and security settings (environment variables)
- Real emails (sign-up codes, password-reset links): SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, SMTP_FROM. Gmail: turn on 2-step verification and create an App Password.
- Real SMS codes: TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM. Without them, codes are printed in the server console, and shown on screen in local demo mode only.
- Production: ENV=production, a long random SECRET_KEY, ADMIN_EMAIL and ADMIN_PASSWORD (the first admin). Demo accounts are NOT created in production unless SEED_DEMO=1.
- Label scanning with Claude vision: ANTHROPIC_API_KEY (optional, OCR_MODEL). Without it the browser reads labels itself.
- RL_AUTH (default 20) and RL_API (default 300): requests per minute per IP for sign-in/OTP endpoints and for everything else.
