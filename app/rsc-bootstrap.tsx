"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";
import mobileRuntime from "./mobile-runtime.js?raw";
import globalStyles from "./globals.css?raw";

const criticalStyles = globalStyles.replace('@import "tailwindcss";', "");

export default function RscBootstrap() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <>
        <style data-stillpoint-critical dangerouslySetInnerHTML={{ __html: criticalStyles }} />
        <script
          data-stillpoint-runtime
          dangerouslySetInnerHTML={{
            __html:
              "self.__VINEXT_RSC_CHUNKS__=self.__VINEXT_RSC_CHUNKS__||[];" +
              mobileRuntime,
          }}
        />
      </>
    );
  });

  return null;
}
