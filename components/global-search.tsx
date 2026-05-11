"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Loader2, ExternalLink, X, } from "lucide-react";
import { PulsingLoader } from "@/components/ui";

interface GlobalSearchProps {
  role: "admin" | "staff" |"faculty" | "student";
  placeholder?: string;
}

interface SearchResult {
  id: string;
  title: string;
  type: "Guideline" | "Event" | "User" | "Survey";
}

export default function GlobalSearch({ role, placeholder = "Search events, users, guidelines, surveys..." }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNavigating = useRef(false);

  // close and clear search when clicking a result / navigating
  useEffect(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(-1);
    isNavigating.current = false;
  }, [pathname, searchParams]);

  const AVAILABLE_CATEGORIES = useMemo(() => [
    { id: "Events",     type: "Event"  },
    ...(role === "admin" ? [{ id: "Users", type: "User" }] : []),
    { id: "Guidelines", type: "Guideline" },
    { id: "Surveys",    type: "Survey" },
  ], [role]);


  // debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // fetch results
  useEffect(() => {
    if (debouncedQuery.trim().length < 1) {
      setResults([]);
      setLoading(false);
      setSelectedIndex(-1);
      return;
    }

    async function fetchResults() {
      setLoading(true);
      try {
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok && !isNavigating.current) {
          const data = await res.json();
          if (!isNavigating.current) {
            setResults(data.results || []);
            setOpen(true);
            setSelectedIndex(-1);
          }
        }
      } catch (err) {
        
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [debouncedQuery]);

  // close dropdown on click outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handleSelect = useCallback((r: SearchResult, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    isNavigating.current = true;
    setOpen(false);
    inputRef.current?.blur();

    if (r.type === "Guideline") {
      router.push(`/${role}/guidelines?search=${encodeURIComponent(r.title)}`);
    } else if (r.type === "Event") {
      router.push(`/${role}/events?search=${encodeURIComponent(r.title)}`);
    } else if (r.type === "User" && role === "admin") {
      router.push(`/admin/users?search=${encodeURIComponent(r.title)}`);
    } else if (r.type === "Survey") {
      router.push(`/${role}/surveys?search=${encodeURIComponent(r.title)}`);
    }
  }, [router, role]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
    if (!open && e.target.value.trim().length >= 1 && !isNavigating.current) {
      setOpen(true);
    }
  }, [open]);

  const flattenedResults = useMemo(() => {
    const list: SearchResult[] = [];
    AVAILABLE_CATEGORIES.forEach(c => {
      const catResults = results.filter(r => r.type === c.type).slice(0, 3);
      list.push(...catResults);
    });
    return list;
  }, [results, AVAILABLE_CATEGORIES]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < flattenedResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flattenedResults.length) {
        handleSelect(flattenedResults[selectedIndex]);
      } else if (query.trim().length >= 1) {
        setOpen(false);
        router.push(`/${role}/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
        setOpen(false);
    }
  }, [query, role, router, selectedIndex, flattenedResults, handleSelect]);

  const handleFocus = useCallback(() => {
    if (query.trim().length >= 1) setOpen(true);
  }, [query]);

  return (
    <div className="search-wrap" style={{ width: "100%", position: "relative" }} ref={containerRef}>
      <span className="search-icon"><Search size={15} /></span>
      <input
        className="search-input"
        maxLength={64}
        ref={inputRef}
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
      />
      {query && (
        <button
          onClick={() => { setQuery(""); setOpen(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray)] hover:text-[var(--primary-dark)] bg-transparent border-none cursor-pointer"
        >
          <X size={15} />
        </button>
      )}

      {open && query.trim().length >= 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-float)] border border-black/[0.05] z-[100] overflow-hidden flex flex-col max-h-[85vh]">
          {/* Results Area */}
          {loading ? (
            <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--gray)", fontSize: 13 }}>
              <PulsingLoader variant="breath" />
            </div>
          ) : results.length > 0 ? (
            <div style={{ overflowY: "auto", flex: 1, paddingBottom: 8 }}>
              {AVAILABLE_CATEGORIES.map(c => {
                const catResults = results.filter(r => r.type === c.type);
                if (catResults.length === 0) return null;

                return (
                  <div key={c.id} className="border-b border-black/[0.05] last:border-0 pb-2">
                    <div className="px-4 py-3 flex items-center gap-3">
                      <span className="text-[12px] uppercase tracking-wider font-bold text-[var(--gray)]">{c.id}</span>
                      <span className="bg-[var(--lavender)] text-[var(--primary-dark)] px-2 py-0.5 rounded-full text-[10px] font-bold">{catResults.length}</span>
                      
                      {catResults.length >= 4 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            isNavigating.current = true;
                            setOpen(false);
                            inputRef.current?.blur();
                            if (c.id === "Guidelines") router.push(`/${role}/guidelines?search=${encodeURIComponent(query)}`);
                            else if (c.id === "Events") router.push(`/${role}/events?search=${encodeURIComponent(query)}`);
                            else if (c.id === "Users") router.push(`/admin/users?search=${encodeURIComponent(query)}`);
                            else if (c.id === "Surveys") router.push(`/${role}/surveys?search=${encodeURIComponent(query)}`);
                          }}
                          className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          See all <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col">
                      {catResults.slice(0, 3).map(r => {
                        const isSelected = flattenedResults.indexOf(r) === selectedIndex;
                        
                        // Highlight match logic
                        const parts = query.trim() ? r.title.split(new RegExp(`(${query.trim()})`, 'gi')) : [r.title];

                        return (
                          <div
                            key={r.id + r.type}
                            onClick={(e) => handleSelect(r, e)}
                            className={`px-4 py-2.5 flex items-center justify-between cursor-pointer group hover:bg-[rgba(45,42,74,0.04)] transition-colors`}
                            style={isSelected ? { borderLeft: "3px solid var(--primary-dark)", paddingLeft: 13, background: "rgba(45,42,74,0.04)" } : {}}
                          >
                            <span className="text-[14px] text-[var(--primary-dark)] font-medium truncate">
                              {parts.map((part, i) => 
                                part.toLowerCase() === query.trim().toLowerCase() ? (
                                  <span key={i} className="font-bold border-b-2 border-[var(--soft-pink)]">{part}</span>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </span>
                            <span className={`transition-opacity text-[var(--gray)] ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}><ExternalLink size={14} /></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
                <Search size={26} className="text-[var(--periwinkle)]" />
              </div>
              <p className="label text-[var(--primary-dark)]">No results found</p>
            </div>
          )}

          {/* Footer Area */}
          <div className="px-4 py-2.5 border-t border-black/[0.05] flex items-center justify-between bg-[rgba(240,240,245,0.4)]">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isNavigating.current = true;
                setOpen(false);
                inputRef.current?.blur();
                router.push(`/${role}/search?q=${encodeURIComponent(query)}`);
              }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
            >
              {/* <ExternalLink size={13} /> Open search page */}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}