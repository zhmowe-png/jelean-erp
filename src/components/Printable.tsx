import type { ReactNode } from "react";

export function Printable({ children }: { children: ReactNode }) {
  return <div className="print-area">{children}</div>;
}
