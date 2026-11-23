def holt_winters(y, m=7, alpha=.3, beta=.05, gamma=.3, h=7):
    """Additive Holt-Winters (level + trend + weekly season) in plain Python. Returns h forecasts."""
    if len(y) < 2 * m:
        avg = sum(y) / max(len(y), 1); return [avg] * h
    level = sum(y[:m]) / m; trend = (sum(y[m:2 * m]) - sum(y[:m])) / (m * m); season = [y[i] - level for i in range(m)]
    for t, v in enumerate(y):
        s = season[t % m]; last = level
        level = alpha * (v - s) + (1 - alpha) * (level + trend)
        trend = beta * (level - last) + (1 - beta) * trend
        season[t % m] = gamma * (v - level) + (1 - gamma) * s
    return [max(0.0, level + (k + 1) * trend + season[(len(y) + k) % m]) for k in range(h)]
