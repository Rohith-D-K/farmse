#!/bin/sh
set -e

DB_FILE="${DB_PATH:-/data/farmse.db}"

# Run DB init on first launch (when DB doesn't exist yet)
if [ ! -f "$DB_FILE" ]; then
    echo "🌱 First run detected — initialising database..."
    node --import tsx/esm src/init-db.ts
    echo "✅ Database initialised."

    echo "🌱 Seeding sample data..."
    node --import tsx/esm scripts/clear-and-seed.ts
    echo "✅ Seed complete."
else
    echo "✅ Database already exists, skipping init."
fi

exec "$@"
