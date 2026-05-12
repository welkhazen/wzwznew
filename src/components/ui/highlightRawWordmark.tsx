import type { ReactNode } from "react";

import { BrandName } from "./brand-name";

export function highlightRawWordmark(content: ReactNode): ReactNode {
  if (typeof content === "string") {
    const parts = content.split(/(raW)/g);
    return parts.map((part, index) =>
      part === "raW" ? <BrandName key={`raw-${index}`} /> : <span key={`txt-${index}`}>{part}</span>
    );
  }

  if (Array.isArray(content)) {
    return content.map((child, index) => <span key={`node-${index}`}>{highlightRawWordmark(child)}</span>);
  }

  return content;
}
