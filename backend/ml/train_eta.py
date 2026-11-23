"""Train an XGBoost ETA model. Run once from the backend folder:  python ml/train_eta.py
Needs:  pip install -r requirements-ml.txt
The training data is SIMULATED (rush hours, weekends, parcel weight, number of stops).
When you have real delivery history, replace the data-generation block with a query on your shipments table."""
import json, os
import numpy as np
from xgboost import XGBRegressor

rng = np.random.default_rng(42); N = 6000
dist = rng.uniform(1, 45, N); hour = rng.integers(6, 23, N); wd = rng.integers(0, 7, N); weight = rng.uniform(.2, 25, N); stops = rng.integers(1, 6, N)
rush = (((hour >= 8) & (hour <= 10)) | ((hour >= 17) & (hour <= 20))).astype(float)
speed = 30 * (1 - .4 * rush) * np.where(wd >= 5, 1.12, 1.0)
y = dist / speed * 60 + 4 * stops + np.where(weight > 10, 3, 0) + rng.normal(0, 2.5, N)   # true trip minutes
X = np.column_stack([dist, hour, wd, weight, stops]); cut = int(N * .8)                     # feature order used by the API

model = XGBRegressor(n_estimators=250, max_depth=4, learning_rate=.08, subsample=.9).fit(X[:cut], y[:cut])
pred = model.predict(X[cut:]); base = dist[cut:] / (30 / 1.3) * 60 + 4 * stops[cut:]       # base = the old fixed formula
mae_ml, mae_base = float(np.mean(np.abs(pred - y[cut:]))), float(np.mean(np.abs(base - y[cut:])))
here = os.path.dirname(os.path.abspath(__file__))
model.save_model(os.path.join(here, "eta_model.json"))
meta = {"mae_model": round(mae_ml, 2), "mae_formula": round(mae_base, 2), "improvement_pct": round((1 - mae_ml / mae_base) * 100, 1), "trips": N}
json.dump(meta, open(os.path.join(here, "eta_meta.json"), "w"))
print("Saved ml/eta_model.json.", meta)
