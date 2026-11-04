import { Check, Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchSchools, type PublicSchool } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

/** Accessible combobox for picking a registered school by name or city. */
export function SchoolPicker({ value, onChange, error, label = "School" }: { value: PublicSchool | null; onChange: (school: PublicSchool | null) => void; error?: string; label?: string }) {
  const id = useId();
  const [query, setQuery] = useState(value ? value.name : "");
  const [results, setResults] = useState<PublicSchool[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value || query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchSchools(query.trim())
        .then((schools) => { setResults(schools); setActive(0); setOpen(true); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => { window.clearTimeout(timer); setLoading(false); };
  }, [query, value]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const choose = (school: PublicSchool) => {
    onChange(school);
    setQuery(school.name);
    setOpen(false);
  };

  const showList = open && !value && query.trim().length >= 2;

  return (
    <div ref={wrapper} className="relative space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <Input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          className="pl-10 pr-10"
          placeholder="Type your school's name or city"
          value={query}
          onChange={(event) => { setQuery(event.target.value); if (value) onChange(null); }}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={(event) => {
            if (!showList || results.length === 0) return;
            if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => Math.min(index + 1, results.length - 1)); }
            if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(index - 1, 0)); }
            if (event.key === "Enter") { event.preventDefault(); choose(results[active]); }
            if (event.key === "Escape") setOpen(false);
          }}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-ink-soft" /> : value ? <Check className="h-4 w-4 text-sage" /> : null}
        </span>
      </div>
      {value ? <p className="flex items-center gap-1 text-xs text-ink-muted"><MapPin className="h-3 w-3" />{value.city}{value.state ? `, ${value.state}` : ""}</p> : null}
      {error ? <p id={`${id}-error`} className="text-xs font-medium text-brick">{error}</p> : null}
      {showList ? (
        <ul id={`${id}-list`} role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-line bg-paper p-1.5 shadow-lift">
          {results.length === 0 && !loading ? <li className="px-3 py-2.5 text-sm text-ink-muted">No school found. Ask your school to register on ClassSync first.</li> : null}
          {results.map((school, index) => (
            <li
              key={school._id}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => { event.preventDefault(); choose(school); }}
              onMouseEnter={() => setActive(index)}
              className={cn("cursor-pointer rounded-lg px-3 py-2.5", index === active && "bg-peach-50")}
            >
              <p className="text-sm font-semibold text-ink">{school.name}</p>
              <p className="text-xs text-ink-muted">{school.city}{school.state ? `, ${school.state}` : ""}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
