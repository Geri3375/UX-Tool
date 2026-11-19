"use client";

import { BookOpenText, ExternalLink, FileSearch, Library, Menu, PanelRightClose, Search, Settings } from "lucide-react";
import { Fragment, useMemo, useRef, useState } from "react";

import { SearchInput } from "@/components/search-input";
import type { LibraryDocument } from "@/lib/library";
import type { SearchResponse, SearchResult } from "@/lib/search";

type AppShellProps = { documents: LibraryDocument[] };

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function HighlightedExcerpt({ excerpt }: { excerpt: string }) {
  const parts = excerpt.split(/\[\[\[(.*?)\]\]\]/g);
  return <>{parts.map((part, index) => index % 2 === 1
    ? <mark key={`${index}-${part}`}>{part}</mark>
    : <Fragment key={`${index}-${part}`}>{part}</Fragment>)}</>;
}

function SearchResultCard({ documentUrl, result }: { documentUrl?: string; result: SearchResult }) {
  const sourceUrl = documentUrl ? `${documentUrl}#page=${result.pdfPageNumber}` : undefined;
  return (
    <article className="search-result">
      <div className="search-result-meta">
        <span>{result.title}</span><span aria-hidden="true">·</span><span>PDF page {result.pdfPageNumber}</span>
        {result.printedPageLabel ? <span>Printed page {result.printedPageLabel}</span> : null}
      </div>
      {result.sectionTitle ? <h2>{result.sectionTitle}</h2> : null}
      <p><HighlightedExcerpt excerpt={result.excerpt} /></p>
      {sourceUrl ? <a href={sourceUrl} rel="noreferrer" target="_blank">Open source page<ExternalLink aria-hidden="true" size={14} /></a> : null}
    </article>
  );
}

export function AppShell({ documents }: AppShellProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "complete" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const documentUrls = useMemo(() => new Map(documents.map((document) => [document.storagePath, document.publicUrl])), [documents]);
  const pdfCount = useMemo(
    () => documents.filter((document) => document.mimeType === "application/pdf" || document.storagePath.toLowerCase().endsWith(".pdf")).length,
    [documents],
  );

  async function searchLibrary(nextQuery: string) {
    setQuery(nextQuery); setStatus("loading"); setError(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(nextQuery)}`, { cache: "no-store" });
      const payload = await response.json() as SearchResponse | { error: string };
      if (!response.ok || !("results" in payload)) throw new Error("error" in payload ? payload.error : "Search failed.");
      setResults(payload.results); setStatus("complete");
    } catch (searchError) {
      setResults([]); setStatus("error");
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
    }
  }

  function startNewSearch() {
    setQuery(""); setResults([]); setStatus("idle"); setError(null);
    searchAreaRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-row"><span className="brand-mark" aria-hidden="true">C</span><span className="brand-name">Clarity</span></div>
        <button className="new-question" type="button" onClick={startNewSearch}><Search aria-hidden="true" size={17} />New search</button>
        <nav className="primary-nav" aria-label="Product">
          <a className="nav-item active" href="#search" aria-current="page"><FileSearch aria-hidden="true" size={17} />Search</a>
          <a className="nav-item" href="#library"><Library aria-hidden="true" size={17} />Library</a>
        </nav>
        <div className="search-help"><p>Search tips</p><span>Use quotes for exact phrases.</span><span>Use OR between alternatives.</span><span>Use -word to exclude a term.</span></div>
        <a className="nav-item settings-link" href="#settings"><Settings aria-hidden="true" size={17} />Settings</a>
      </aside>

      <main className="workspace" id="search">
        <header className="topbar">
          <button className="mobile-menu" type="button" aria-label="Open navigation"><Menu aria-hidden="true" size={20} /></button>
          <div><p>UX literature search</p><span><BookOpenText aria-hidden="true" size={13} />{pdfCount} source PDFs</span></div>
        </header>
        <div className="conversation-layout">
          <div className="search-column" ref={searchAreaRef}>
            <section className="search-heading" aria-labelledby="search-heading">
              <p>Private knowledge library</p><h1 id="search-heading">Find evidence in your UX books</h1>
              <span>Keyword search across extracted PDF pages. No AI-generated answers.</span>
              <SearchInput busy={status === "loading"} onSearch={searchLibrary} />
            </section>
            <section className="search-results" aria-live="polite" aria-busy={status === "loading"}>
              {status === "idle" ? <div className="search-empty"><FileSearch aria-hidden="true" size={24} /><h2>Search the complete library</h2><p>Results include the matching passage, book title, and PDF page.</p></div> : null}
              {status === "loading" ? <div className="search-state">Searching indexed pages…</div> : null}
              {status === "error" ? <div className="search-state search-error" role="alert"><strong>Search unavailable</strong><span>{error}</span></div> : null}
              {status === "complete" && results.length === 0 ? <div className="search-empty"><Search aria-hidden="true" size={24} /><h2>No exact matches for “{query}”</h2><p>Try fewer words, another spelling, or alternatives joined with OR.</p></div> : null}
              {status === "complete" && results.length > 0 ? <><div className="results-summary"><strong>{results.length} matches</strong><span>for “{query}”</span></div><div className="results-list">{results.map((result) => <SearchResultCard documentUrl={documentUrls.get(result.storagePath)} key={`${result.sourceId}-${result.pdfPageNumber}`} result={result} />)}</div></> : null}
            </section>
          </div>
          <aside className="source-panel" id="library" aria-label="Document library">
            <div className="source-panel-header"><div><p>Document library</p><span>Supabase · UX Literature</span></div><button className="icon-button" type="button" aria-label="Close source panel"><PanelRightClose aria-hidden="true" size={18} /></button></div>
            <div className="library-list">{documents.map((document) => <a className="library-document" href={document.publicUrl} key={document.id} rel="noreferrer" target="_blank"><span className="library-document-icon" aria-hidden="true"><BookOpenText size={17} /></span><span className="library-document-copy"><strong>{document.title}</strong><small>{formatFileSize(document.sizeBytes)} · PDF source</small></span><ExternalLink aria-hidden="true" size={14} /></a>)}</div>
          </aside>
        </div>
      </main>
    </div>
  );
}
