# SMART COURIER
npm install && npm run dev
Demo login: any valid email + any password (6+ chars). Pick USER / ADMIN / COURIER on the login screen.
Tracking IDs to try: SC-2026-94821, SC-2026-94822, SC-2026-94823

## Connect to the backend
Start the backend first (uvicorn on port 8000), then run this app. To use another address, create a .env file with VITE_API=http://localhost:8000/api

Real location: needs internet (OpenStreetMap tiles, OSRM routing, Nominatim address search). Run npm install again after updating. Delivery OTP: customers see a 4-digit code; couriers must enter it to mark Delivered. Courier login: ravi@mail.com / password123.
