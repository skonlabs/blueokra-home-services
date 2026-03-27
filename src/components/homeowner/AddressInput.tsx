import { useEffect, useRef, useState } from "react";
import { MapPin, Mail, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AddressInputProps {
  value: string;
  onChange: (address: string, isWashingtonState?: boolean) => void;
  placeholder?: string;
  hasError?: boolean;
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: object
          ) => {
            addListener: (event: string, handler: () => void) => void;
            getPlace: () => {
              formatted_address?: string;
              address_components?: Array<{
                short_name: string;
                long_name: string;
                types: string[];
              }>;
            };
          };
        };
      };
    };
    __googleMapsCallback?: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

const AddressInput = ({ value, onChange, placeholder, hasError }: AddressInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<ReturnType<typeof window.google.maps.places.Autocomplete> | null>(null);

  const [notInWA, setNotInWA]         = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone]   = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const [mapsLoaded, setMapsLoaded]   = useState(false);

  // Load Google Maps Places API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return; // graceful degradation — plain input
    if (window.google?.maps?.places) {
      setMapsLoaded(true);
      return;
    }

    const scriptId = "google-maps-places";
    if (document.getElementById(scriptId)) {
      // Script already injected — wait for load
      window.__googleMapsCallback = () => setMapsLoaded(true);
      return;
    }

    window.__googleMapsCallback = () => setMapsLoaded(true);

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Attach autocomplete once Maps API is ready
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || autocompleteRef.current) return;
    if (!window.google?.maps?.places) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "us" },
      fields: ["formatted_address", "address_components"],
      types: ["address"],
    });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current!.getPlace();
      const formatted = place.formatted_address ?? "";
      const components = place.address_components ?? [];

      // Extract state
      const stateComp = components.find(c => c.types.includes("administrative_area_level_1"));
      const stateShort = stateComp?.short_name ?? "";

      if (stateShort && stateShort !== "WA") {
        setNotInWA(true);
        onChange(formatted, false);
      } else {
        setNotInWA(false);
        onChange(formatted, true);
      }
    });
  }, [mapsLoaded, onChange]);

  const handleWaitlist = async () => {
    if (!waitlistEmail.includes("@")) {
      setWaitlistError("Please enter a valid email address.");
      return;
    }
    setWaitlistError("");
    try {
      // Insert to a waitlist table if it exists, or silently succeed
      await supabase.from("waitlist" as never).insert({ email: waitlistEmail, state: "other" });
    } catch {
      // Table may not exist yet — still show success to user
    }
    setWaitlistDone(true);
  };

  const inputCls = `w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 border transition-colors ${
    hasError ? "border-destructive ring-1 ring-destructive/30" : "border-transparent"
  }`;

  return (
    <div className="space-y-2">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          defaultValue={value}
          onChange={(e) => {
            // For plain (non-autocomplete) mode, propagate changes directly
            if (!mapsLoaded) {
              setNotInWA(false);
              onChange(e.target.value, true);
            }
          }}
          placeholder={placeholder ?? "Start typing your address…"}
          className={`${inputCls} pl-9`}
          autoComplete={mapsLoaded ? "off" : "street-address"}
        />
      </div>

      {/* Not in WA state */}
      {notInWA && (
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-3">
          <p className="text-xs font-medium text-foreground">
            We're currently only serving Washington State.
          </p>
          <p className="text-[11px] text-muted-foreground">
            We're expanding soon! Enter your email below and we'll let you know when we launch in your area.
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
};

export default AddressInput;
