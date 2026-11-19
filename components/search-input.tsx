"use client";

import { Search } from "lucide-react";
import { FormEvent, useState } from "react";

type SearchInputProps = {
  busy: boolean;
  initialValue?: string;
  onSearch: (query: string) => void;
};

export function SearchInput({ busy, initialValue = "", onSearch }: SearchInputProps) {
  const [query, setQuery] = useState(initialValue);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2 || busy) return;
    onSearch(normalizedQuery);
  }

  return (
    <form className="search-form" onSubmit={submit} role="search">
      <Search aria-hidden="true" size={20} strokeWidth={1.8} />
      <label className="sr-only" htmlFor="library-search">Search the UX literature</label>
      <input
        autoComplete="off"
        autoFocus
        id="library-search"
        maxLength={200}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search concepts, methods, patterns…"
        type="search"
        value={query}
      />
      <button disabled={busy || query.trim().length < 2} type="submit">
        {busy ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
