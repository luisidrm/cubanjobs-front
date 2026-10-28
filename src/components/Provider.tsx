"use client";

import "@/lib/supertokens";

import { ThemeProvider } from "next-themes";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "@/components/ui/sonner";
import i18n from "@/i18n/i18n"; // Adjust this path to your i18n configuration file
import { persistor, store } from "@/store/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </I18nextProvider>
      </PersistGate>
    </Provider>
  );
}
