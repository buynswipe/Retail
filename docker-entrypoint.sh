#!/bin/sh

# Check for required environment variables
required_vars="POSTGRES_URL SUPABASE_URL"
missing_vars=""

for var in $required_vars; do
  if [ -z "$(eval echo \$$var)" ]; then
    missing_vars="$missing_vars $var"
  fi
done

if [ -n "$missing_vars" ]; then
  echo "ERROR: Missing required environment variables:$missing_vars"
  echo "Please set these environment variables and restart the container."
  exit 1
fi

# Print startup message
echo "Starting RetailBandhu with Node.js $(node -v)"
echo "Environment: $NODE_ENV"

# Execute the CMD
exec "$@"
