import { describe, expect, it } from "vitest";

import { getPublicDocumentUrl } from "./library";

describe("getPublicDocumentUrl", () => {
  it("encodes the bucket and every path segment", () => {
    expect(
      getPublicDocumentUrl(
        "https://example.supabase.co",
        "Research/Laws of UX PDF.pdf",
      ),
    ).toBe(
      "https://example.supabase.co/storage/v1/object/public/UX%20Literature/Research/Laws%20of%20UX%20PDF.pdf",
    );
  });
});
