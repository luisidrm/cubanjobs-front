"use client";

import "@/lib/supertokens";

import { ThemeProvider } from "next-themes";
import { useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { Toaster } from "@/components/ui/sonner";
import i18n from "@/i18n/i18n";
import { store } from "@/store/store";

/**
 * `lang` is decided on the server (see app/layout.tsx), so the server HTML and
 * the first client render use the same language and the page is fully rendered
 * before any JavaScript runs.
 *
 * Each provider gets its own i18n instance: the shared one would be mutated by
 * every request on the server. The instance still caches the user's choice in
 * the cookie when they switch language.
 *
 * There is deliberately no redux-persist gate here. It rendered nothing until
 * the browser had rehydrated the store, which left every server response
 * empty. The only persisted slice is an auth hint nothing reads at render time;
 * persistStore() in store.ts still rehydrates it in the background.
 */
export function Providers({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: "en" | "es";
}) {
  const instance = useMemo(() => i18n.cloneInstance({ lng: lang }), [lang]);
  return (
    <Provider store={store}>
      <I18nextProvider i18n={instance}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </I18nextProvider>
    </Provider>
  );
}
