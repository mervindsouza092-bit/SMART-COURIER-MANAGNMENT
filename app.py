import logging
import os

from flask import Flask, jsonify, redirect, render_template, session, url_for

from config import Config
from routes.admin import admin
from routes.auth import auth
from routes.user import user
from utils.database import ping_database


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

    app.register_blueprint(auth)
    app.register_blueprint(user)
    app.register_blueprint(admin)

    @app.get("/")
    def index():
        if not session.get("logged_in"):
            return redirect(url_for("auth.login"))
        endpoint = "admin.dashboard" if session.get("user_role") == "admin" else "user.dashboard"
        return redirect(url_for(endpoint))

    @app.get("/health")
    def health():
        return jsonify({"status": "healthy", "application": "SmartCourier"})

    @app.get("/test-db")
    def test_db():
        if not ping_database():
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Database connection failed.",
                    }
                ),
                503,
            )
        return "Database connection successful!"

    @app.errorhandler(403)
    def forbidden(error):
        return render_template("errors/403.html"), 403

    @app.errorhandler(404)
    def not_found(error):
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.exception("Unhandled server error")
        return render_template("errors/500.html"), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("FLASK_PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
    )
