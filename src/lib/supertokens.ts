import SuperTokens from "supertokens-web-js";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";
import EmailVerification from "supertokens-web-js/recipe/emailverification";
import Session from "supertokens-web-js/recipe/session";

// Guard for SSR: Next.js renders "use client" components once on the server
// too, and supertokens-website's DateProvider touches `window` immediately
// on init — unlike React Native, which has no server-render pass to worry about.
if (typeof window !== "undefined") {
  SuperTokens.init({
    appInfo: {
      appName: "Cuban Jobs",
      apiDomain:
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
      apiBasePath: "/auth",
    },
    recipeList: [
      EmailPassword.init(),
      EmailVerification.init(),
      Session.init(),
    ],
  });
}
