"use client";

import { useEffect } from "react";

// Client-side redirect for the `/` route. We avoid `redirect()` from
// `next/navigation` because it is unsupported with `output: "export"`, and
// the `<meta http-equiv="refresh">` shape is awkward to emit through Next's
// Metadata API (the `other` field uses `name=` not `http-equiv=`). A client
// component with `location.replace` fires immediately on load and preserves
// history so the back button still works as expected.
export function RedirectToDefaultLocale({
  target,
  preserveSearch = false,
}: {
  target: string;
  preserveSearch?: boolean;
}) {
  useEffect(() => {
    const search = preserveSearch ? window.location.search : "";
    window.location.replace(`${target}${search}`);
  }, [preserveSearch, target]);
  return null;
}
