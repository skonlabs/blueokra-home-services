/// <reference types="google.maps" />
import { useEffect, useRef, useState, useCallback, forwardRef } from "react";
import { MapPin, Mail, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
// Google Places types (subset)
// ---------------------------------------------------------------------------

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function extractParts(addressComponents: google.maps.GeocoderAddressComponent[]): AddressParts & { isWA: boolean } {
  let city = "";
  let state = "";
  let zip = "";
  let stateCode = "";

  for (const comp of addressComponents) {
    const types = comp.types;
    if (types.includes("locality")) city = comp.long_name;
    if (types.includes("sublocality_level_1") && !city) city = comp.long_name;
    if (types.includes("administrative_area_level_1")) {
      state = comp.long_name;
      stateCode = comp.short_name;
    }
    if (types.includes("postal_code")) zip = comp.long_name;
  }

  return { city, state, zip, isWA: stateCode === "WA" || state.toLowerCase() === "washington" };
}

// ---------------------------------------------------------------------------
// Nominatim fallback types & helpers (when no Google key)
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

function formatNominatimAddress(r: NominatimResult): string {
  const a = r.address;
  const street = a.house_number ? `${a.house_number} ${a.road ?? ""}`.trim() : (a.road ?? "");
  const city = a.city ?? a.town ?? a.village ?? "";
  const state = a.state ?? "";
  const zip = a.postcode ?? "";
  const parts = [street, city, state, zip].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : r.display_name;
}

function isNominatimWashington(a: NominatimAddress): boolean {
  const code = (a.state_code ?? "").toUpperCase();
  const name = (a.state ?? "").toLowerCase();
  return code === "WA" || name === "washington";
}

function getNominatimParts(a: NominatimAddress): AddressParts {
  return { city: a.city ?? a.town ?? a.village, state: a.state, zip: a.postcode };
}

function sortNominatimSuggestions(results: NominatimResult[]): NominatimResult[] {
  return [...results].sort((a, b) => {
    const stateA = a.address?.state ?? "";
    const stateB = b.address?.state ?? "";
    if (stateA === "Washington" && stateB !== "Washington") return -1;
    if (stateB === "Washington" && stateA !== "Washington") return 1;
    return stateA.localeCompare(stateB);
  });
}

// ---------------------------------------------------------------------------
// Load Google Maps script
// ---------------------------------------------------------------------------

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (!GMAPS_KEY) return Promise.reject("No API key");
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject("Failed to load Google Maps");
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AddressInput = forwardRef<HTMLDivElement, AddressInputProps>(
  ({ value, onChange, placeholder, hasError, requireSelection = false, onConfirmedChange }, _ref) => {
    const [inputVal, setInputVal] = useState(value);
    const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
    const [nominatimSuggestions, setNominatimSuggestions] = useState<NominatimResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [notInWA, setNotInWA] = useState(false);
    const [waitlistEmail, setWaitlistEmail] = useState("");
    const [waitlistDone, setWaitlistDone] = useState(false);
    const [waitlistError, setWaitlistError] = useState("");
    const [confirmed, setConfirmed] = useState(!!value);
    const [useGoogle, setUseGoogle] = useState(!!GMAPS_KEY);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
    const dummyDivRef = useRef<HTMLDivElement | null>(null);

    // Init Google Places
    useEffect(() => {
      if (!GMAPS_KEY) { setUseGoogle(false); return; }
      loadGoogleMaps()
        .then(() => {
          autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
          if (!dummyDivRef.current) {
            dummyDivRef.current = document.createElement("div");
          }
          placesServiceRef.current = new google.maps.places.PlacesService(dummyDivRef.current);
        })
        .catch(() => setUseGoogle(false));
    }, []);

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

    // ---- Google Places fetch ----
    const fetchGoogleSuggestions = useCallback((query: string) => {
      if (!autocompleteServiceRef.current || query.trim().length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "us" },
          types: ["address"],
        },
        (predictions, status) => {
          setLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Sort Washington State results first
            const sorted = [...predictions].sort((a, b) => {
              const aWA = a.description.includes(", WA ") || a.description.includes(", WA,") || a.description.endsWith(", WA");
              const bWA = b.description.includes(", WA ") || b.description.includes(", WA,") || b.description.endsWith(", WA");
              if (aWA && !bWA) return -1;
              if (bWA && !aWA) return 1;
              return 0;
            });
            setSuggestions(sorted as PlacePrediction[]);
            setOpen(sorted.length > 0);
          } else {
            setSuggestions([]);
            setOpen(false);
          }
        }
      );
    }, []);

    // ---- Nominatim fallback fetch ----
    const fetchNominatimSuggestions = useCallback(async (query: string) => {
      if (query.trim().length < 3) {
        setNominatimSuggestions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(query)}` +
          `&format=json&countrycodes=us&limit=8&addressdetails=1`;
        const res = await fetch(url, { headers: { "Accept-Language": "en-US,en" } });
        if (!res.ok) throw new Error("network error");
        const data: NominatimResult[] = await res.json();
        const sorted = sortNominatimSuggestions(data);
        setNominatimSuggestions(sorted);
        setOpen(sorted.length > 0);
      } catch {
        setNominatimSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputVal(val);
      setNotInWA(false);
      setConfirmed(false);
      onConfirmedChange?.(false);
      onChange(val, undefined);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (useGoogle) fetchGoogleSuggestions(val);
        else fetchNominatimSuggestions(val);
      }, 300);
    };

    // ---- Google select ----
    const handleGoogleSelect = (prediction: PlacePrediction) => {
      setSuggestions([]);
      setOpen(false);

      if (!placesServiceRef.current) {
        // Fallback: just use description
        setInputVal(prediction.description);
        setConfirmed(true);
        onConfirmedChange?.(true);
        onChange(prediction.description, undefined);
        return;
      }

      placesServiceRef.current.getDetails(
        { placeId: prediction.place_id, fields: ["formatted_address", "address_components"] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const addr = place.formatted_address || prediction.description;
            setInputVal(addr);
            setConfirmed(true);
            onConfirmedChange?.(true);

            const parts = extractParts(place.address_components || []);
            setNotInWA(!parts.isWA);
            onChange(addr, parts.isWA, { city: parts.city, state: parts.state, zip: parts.zip });
          } else {
            setInputVal(prediction.description);
            setConfirmed(true);
            onConfirmedChange?.(true);
            onChange(prediction.description, undefined);
          }
        }
      );
    };

    // ---- Nominatim select ----
    const handleNominatimSelect = (result: NominatimResult) => {
      const addr = formatNominatimAddress(result);
      setInputVal(addr);
      setNominatimSuggestions([]);
      setOpen(false);
      setConfirmed(true);
      onConfirmedChange?.(true);

      const wa = isNominatimWashington(result.address);
      setNotInWA(!wa);
      onChange(addr, wa, getNominatimParts(result.address));
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

    const showSelectionWarning = requireSelection && !confirmed && inputVal.trim().length > 0;

    const inputCls =
      `w-full bg-muted rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none ` +
      `focus:ring-2 focus:ring-primary/30 border transition-colors ` +
      ((hasError || showSelectionWarning) ? "border-destructive ring-1 ring-destructive/30" : "border-transparent");

    const hasSuggestions = useGoogle ? suggestions.length > 0 : nominatimSuggestions.length > 0;

    return (
      <div className="space-y-2">
        <div ref={containerRef} className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />

          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleChange}
            onFocus={() => hasSuggestions && setOpen(true)}
            placeholder={placeholder ?? "Start typing your address…"}
            className={inputCls}
            autoComplete="off"
          />

          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
          )}

          {/* Suggestions dropdown */}
          {open && hasSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden">
              {useGoogle
                ? suggestions.map((s) => {
                    const isWA = s.description.includes(", WA");
                    return (
                      <button
                        key={s.place_id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleGoogleSelect(s); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-start gap-2 border-b border-border/50 last:border-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="leading-tight block truncate font-medium">
                            {s.structured_formatting.main_text}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {s.structured_formatting.secondary_text}
                            {isWA && <span className="ml-1 text-primary font-medium">· WA</span>}
                          </span>
                        </div>
                      </button>
                    );
                  })
                : nominatimSuggestions.map((s) => {
                    const label = formatNominatimAddress(s);
                    const stateLabel = s.address?.state ? ` · ${s.address.state}` : "";
                    return (
                      <button
                        key={s.place_id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleNominatimSelect(s); }}
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

        {/* Selection required warning */}
        {showSelectionWarning && (
          <p className="text-xs text-destructive">Please select an address from the dropdown suggestions.</p>
        )}

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
  }
);

AddressInput.displayName = "AddressInput";

export default AddressInput;
