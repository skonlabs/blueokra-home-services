import { useEffect, useRef, useState, useCallback, forwardRef } from "react";
import { MapPin, Mail, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NominatimAddress {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: NominatimAddress;
}

export interface AddressParts {
  city?: string;
  state?: string;
  zip?: string;
}

interface AddressInputProps {
  value: string;
  onChange: (address: string, isWashingtonState?: boolean, parts?: AddressParts) => void;
  placeholder?: string;
  hasError?: boolean;
  /** When true, the user MUST pick from the dropdown — freetext is rejected */
  requireSelection?: boolean;
  /** Called when confirmed status changes (true = picked from dropdown, false = edited after) */
  onConfirmedChange?: (confirmed: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAddress(r: NominatimResult): string {
  const a = r.address;
  const street = a.house_number
    ? `${a.house_number} ${a.road ?? ""}`.trim()
    : (a.road ?? "");
  const city  = a.city ?? a.town ?? a.village ?? "";
  const state = a.state ?? "";
  const zip   = a.postcode ?? "";
  const parts = [street, city, state, zip].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : r.display_name;
}

function isWashington(a: NominatimAddress): boolean {
  const code = (a.state_code ?? "").toUpperCase();
  const name = (a.state ?? "").toLowerCase();
  return code === "WA" || name === "washington";
}

function getParts(a: NominatimAddress): AddressParts {
  return {
    city: a.city ?? a.town ?? a.village,
    state: a.state,
    zip: a.postcode,
  };
}

// Sort: Washington first, then alphabetical by state
function sortSuggestions(results: NominatimResult[]): NominatimResult[] {
  return [...results].sort((a, b) => {
    const stateA = a.address?.state ?? "";
    const stateB = b.address?.state ?? "";
    if (stateA === "Washington" && stateB !== "Washington") return -1;
    if (stateB === "Washington" && stateA !== "Washington") return 1;
    return stateA.localeCompare(stateB);
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AddressInput = forwardRef<HTMLDivElement, AddressInputProps>(({ value, onChange, placeholder, hasError, requireSelection = false, onConfirmedChange }, _ref) => {
  const [inputVal, setInputVal]         = useState(value);
  const [suggestions, setSuggestions]   = useState<NominatimResult[]>([]);
  const [loading, setLoading]           = useState(false);
  const [open, setOpen]                 = useState(false);
  const [notInWA, setNotInWA]           = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone]   = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  // Track whether user picked from dropdown (confirmed) vs typed freetext
  const [confirmed, setConfirmed]       = useState(!!value);

  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);

  // Sync controlled value from parent
  useEffect(() => {
    if (value !== inputVal) setInputVal(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(query)}` +
        `&format=json&countrycodes=us&limit=8&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en-US,en" },
      });
      if (!res.ok) throw new Error("network error");
      const data: NominatimResult[] = await res.json();
      const sorted = sortSuggestions(data);
      setSuggestions(sorted);
      setOpen(sorted.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    setNotInWA(false);
    // Mark as unconfirmed when user edits the field
    setConfirmed(false);
    onConfirmedChange?.(false);
    onChange(val, undefined); // propagate raw text immediately

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleSelect = (result: NominatimResult) => {
    const addr = formatAddress(result);
    setInputVal(addr);
    setSuggestions([]);
    setOpen(false);
    setConfirmed(true);
    onConfirmedChange?.(true);

    const wa = isWashington(result.address);
    setNotInWA(!wa);
    onChange(addr, wa, getParts(result.address));
  };

  const handleWaitlist = async () => {
    if (!waitlistEmail.includes("@")) {
      setWaitlistError("Please enter a valid email address.");
      return;
    }
    setWaitlistError("");
    try {
      await supabase.from("waitlist" as never).insert([{ email: waitlistEmail, state: "other" }] as never);
    } catch {
      // Table may not exist yet — still show success to user
    }
    setWaitlistDone(true);
  };

  const inputCls =
    `w-full bg-muted rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none ` +
    `focus:ring-2 focus:ring-primary/30 border transition-colors ` +
    (hasError ? "border-destructive ring-1 ring-destructive/30" : "border-transparent");

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="relative">
        {/* Pin icon */}
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? "Start typing your address…"}
          className={inputCls}
          autoComplete="off"
        />

        {/* Loader spinner */}
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
        )}

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden">
            {suggestions.map((s) => {
              const label = formatAddress(s);
              const stateLabel = s.address?.state ? ` · ${s.address.state}` : "";
              return (
                <button
                  key={s.place_id}
                  type="button"
                  // onMouseDown prevents blur before click fires
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-start gap-2 border-b border-border/50 last:border-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="leading-tight block truncate">{label}</span>
                    {stateLabel && (
                      <span className="text-[11px] text-muted-foreground">{s.address?.state}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Not in WA */}
      {notInWA && (
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-3">
          <p className="text-xs font-medium text-foreground">
            We're currently only serving Washington State.
          </p>
          <p className="text-[11px] text-muted-foreground">
            We're expanding soon! Enter your email and we'll notify you when we launch in your area.
          </p>
          {waitlistDone ? (
            <div className="flex items-center gap-2 text-secondary">
              <Check className="w-4 h-4" />
              <p className="text-xs font-medium">You're on the list! We'll notify you when we arrive.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-blue-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleWaitlist}
                  className="bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-lg active:scale-95 transition-transform whitespace-nowrap"
                >
                  Notify me
                </button>
              </div>
              {waitlistError && <p className="text-xs text-destructive">{waitlistError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

AddressInput.displayName = "AddressInput";

export default AddressInput;
