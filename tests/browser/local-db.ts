import { neonConfig } from "@neondatabase/serverless";

// Specs talk to the DB directly for setup/cleanup; under scripts/local-db.sh they must hit the same local endpoint as the app.
const endpoint = process.env.DAILYLEET_LOCAL_NEON_ENDPOINT;
if (endpoint) neonConfig.fetchEndpoint = endpoint;
