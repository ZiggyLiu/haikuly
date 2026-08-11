"use client";

import { useServerInsertedHTML } from "next/navigation";

export default function RscBootstrap() {
  useServerInsertedHTML(() => (
    <script
      dangerouslySetInnerHTML={{
        __html: "self.__VINEXT_RSC_CHUNKS__=self.__VINEXT_RSC_CHUNKS__||[];",
      }}
    />
  ));

  return null;
}
