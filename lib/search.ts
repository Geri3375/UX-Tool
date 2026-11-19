export type SearchResult = {
  sourceId: string;
  title: string;
  storagePath: string;
  pdfPageNumber: number;
  printedPageLabel: string | null;
  sectionTitle: string | null;
  excerpt: string;
  rank: number;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
};
