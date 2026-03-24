#!/bin/sh
set -e

echo "🔧 Running database initialization..."
node --import tsx/esm src/init-db.ts
echo "✅ Database ready."

# Automatic seeding disabled to prevent accidental wipe of user data
# SEED_FLAG="/tmp/.farmse_seeded"
# if [ ! -f "$SEED_FLAG" ]; then
#     echo "🌱 Seeding sample data..."
#     node --import tsx/esm scripts/clear-and-seed.ts
#     echo "✅ Seed complete."
#     touch "$SEED_FLAG"
# fi

exec "$@"
