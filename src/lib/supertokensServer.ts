import "server-only";

import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";

// Server-side init, separate from src/lib/supertokens.ts (the browser SDK).
// Talks directly to the SuperTokens core — same one the Express API uses —
// so proxy.ts can verify a session's JWT locally (signature + expiry only,
// no user lookup) without a network round-trip to the API. Only the Session
// recipe is needed: getSSRSession just wants access to its JWKS, not the
// email/password recipes.
supertokens.init({
  appInfo: {
    appName: "Cuban Jobs",
    apiDomain: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
    // supertokens.init() requires this even though getSSRSession never uses
    // it (JWT verification only needs apiDomain, for the JWKS) — it's this
    // app's own origin, i.e. where the browser actually is.
    websiteDomain: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    apiBasePath: "/auth",
  },
  supertokens: {
    connectionURI: process.env.SUPERTOKENS_CORE_URL || "http://localhost:43567",
    ...(process.env.SUPERTOKENS_API_KEY
      ? { apiKey: process.env.SUPERTOKENS_API_KEY }
      : {}),
  },
  recipeList: [Session.init()],
});

export { supertokens };
