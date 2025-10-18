import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { api } from "~/utils/api";
import { LoadingProvider } from "~/contexts/LoadingContext";
import { LoadingOverlay } from "~/components/LoadingOverlay";

import "~/styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <LoadingProvider>
        <div className="font-sans">
          <Component {...pageProps} />
          <LoadingOverlay />
          <SpeedInsights />
        </div>
      </LoadingProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
