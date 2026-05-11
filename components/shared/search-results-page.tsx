"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Card, Badge, Button, Tabs } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { paginate, totalPages } from "@/lib/pagination.utils";

interface SearchResult {
  id: string;
  title: string;
  type: "Guideline" | "Event" | "User" | "Survey";
}

function SearchResultsContent({ role }: { role: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const categoryTabs = [
    "Events",
    ...(role === "admin" ? ["Users"] : []),
    "Guidelines",
    "Surveys",
  ];
  const availableTabs = ["All", ...categoryTabs];

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("All");
  const PER_PAGE_SEARCH = 10;

  useEffect(() => {
    async function fetchAll() {
      if (!query || query.trim().length < 1) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(query)}&all=true`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setPage(1);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [query]);

  const handleSelect = (r: SearchResult) => {
    if (r.type === "Guideline") {
      router.push(`/${role}/guidelines?search=${encodeURIComponent(r.title)}`);
    } else if (r.type === "Event") {
      router.push(`/${role}/events?search=${encodeURIComponent(r.title)}`);
    } else if (r.type === "User" && role === "admin") {
      router.push(`/admin/users?search=${encodeURIComponent(r.title)}`);
    } else if (r.type === "Survey") {
      router.push(`/${role}/surveys?search=${encodeURIComponent(r.title)}`);
    }
  };

  const filteredResults = results.filter((r) => {
    if (activeTab === "All") return true;
    if (activeTab === "Events" && r.type === "Event") return true;
    if (activeTab === "Users" && r.type === "User") return true;
    if (activeTab === "Guidelines" && r.type === "Guideline") return true;
    if (activeTab === "Surveys" && r.type === "Survey") return true;
    return false;
  });

  const paginatedResults = paginate(filteredResults, page, PER_PAGE_SEARCH);
  const total = totalPages(filteredResults.length, PER_PAGE_SEARCH);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="heading-md" style={{ color: "var(--primary-dark)" }}>
          Search Results for "{query}"
        </h2>
        
        {!loading && results.length > 0 && (
          <div className="pt-2 overflow-x-auto pb-1" style={{ maxWidth: '100vw' }}>
            <Tabs 
              tabs={availableTabs} 
              defaultTab={activeTab} 
              onChange={(tab) => {
                setActiveTab(tab);
                setPage(1);
              }} 
            />
          </div>
        )}
      </div>

      {loading ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-[var(--gray)]">
            <Loader2 size={24} className="animate-spin" />
            <span className="caption">Searching across all records...</span>
          </div>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
              <Search size={26} className="text-[var(--periwinkle)]" />
            </div>
            <p className="label text-[var(--primary-dark)]">No results found for your search</p>
            <Button variant={"ghost"} size="sm" onClick={() => router.back()}>
              Go back
            </Button>
          </div>
        </Card>
      ) : filteredResults.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
              <Search size={26} className="text-[var(--periwinkle)]" />
            </div>
            <p className="label text-[var(--primary-dark)]">No {activeFilters.length > 0 ? activeFilters.join(", ").toLowerCase() : "results"} found for your search</p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-col">
              {paginatedResults.map((r, i) => (
                <div
                  key={r.id + r.type + i}
                  onClick={() => handleSelect(r)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-[rgba(45,42,74,0.04)] transition-colors border-b border-black/[0.05] last:border-0"
                >
                  <div className="flex flex-col gap-1">
                    <span
                      className="font-medium text-[var(--primary-dark)]"
                      style={{ fontSize: 15 }}
                    >
                      {query.trim() ? (
                        r.title.split(new RegExp(`(${query.trim()})`, 'gi')).map((part, i) => 
                          part.toLowerCase() === query.trim().toLowerCase() ? (
                            <span key={i} className="font-bold border-b-2 border-[var(--soft-pink)]">{part}</span>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )
                      ) : (
                        r.title
                      )}
                    </span>
                  </div>
                  <Badge variant={r.type === "User" ? "pink-light" : r.type === "Guideline" ? "periwinkle" : r.type === "Survey" ? "pink-light" : "dark"}>
                    {r.type}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {total > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-3 mt-2">
              <span className="caption">
                Showing {Math.min((page - 1) * PER_PAGE_SEARCH + 1, filteredResults.length)}–{Math.min(page * PER_PAGE_SEARCH, filteredResults.length)} of {filteredResults.length} results
              </span>
              <Pagination
                page={page}
                total={total}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { Suspense } from "react";

export default function SearchResultsPage({ role }: { role: string }) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={24} className="animate-spin text-[var(--gray)]" />
        <span className="caption">Loading...</span>
      </div>
    }>
      <SearchResultsContent role={role} />
    </Suspense>
  );
}
