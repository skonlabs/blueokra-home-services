import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Check, ChevronRight, X } from "lucide-react";

interface JobSummary {
  id: string;
  service: string;
  customer: string;
  address: string;
  price: string;
}

interface ProviderCompletionProps {
  job?: JobSummary | null;
  onDone: () => void;
}

const DEFAULT_JOB: JobSummary = {
  id: "job-default",
  service: "Lawn Mowing",
  customer: "Sarah M.",
  address: "123 Main St",
  price: "$195",
};

const CHECKLIST_ITEMS = [
  { label: "Work completed as described", required: true },
  { label: "Area cleaned up", required: true },
  { label: "Customer satisfied", required: true },
  { label: "Site inspection done", required: false },
];

const REASONS = [
  "Standard completion",
  "Larger area than estimated",
  "Extra complexity",
  "Less work than estimated",
];

const ProviderCompletion = ({ job: jobProp, onDone }: ProviderCompletionProps) => {
  const job = jobProp ?? DEFAULT_JOB;
  const rawPrice = parseFloat(job.price.replace(/[^0-9.]/g, "")) || 195;
  const QUOTE_LOW = Math.round(rawPrice * 0.9);
  const QUOTE_HIGH = Math.round(rawPrice * 1.25);

  const [step, setStep] = useState<"photos" | "adjust" | "qr" | "done">("photos");
  const [photos, setPhotos] = useState<string[]>([]);
  const [adjustedPrice, setAdjustedPrice] = useState(String(rawPrice));
  const [checkedItems, setCheckedItems] = useState<boolean[]>(CHECKLIST_ITEMS.map(() => false));
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) setPhotos((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const allRequiredChecked = CHECKLIST_ITEMS.every((item, i) => !item.required || checkedItems[i]);

  const parsedPrice = parseFloat(adjustedPrice);
  const priceValid = !isNaN(parsedPrice) && parsedPrice >= 0;

  // Auto-select "Standard completion" when price is in range
  const handlePriceChange = (val: string) => {
    setAdjustedPrice(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p >= QUOTE_LOW && p <= QUOTE_HIGH) {
      setSelectedReason("Standard completion");
    }
    if (!isNaN(p) && p >= 0) {
      setPriceError(null);
    }
  };

  const handlePriceBlur = () => {
    const p = parseFloat(adjustedPrice);
    if (isNaN(p) || p < 0) {
      setPriceError("Please enter a valid price ($0 or above)");
    } else {
      setPriceError(null);
    }
  };

  const canProceedToQr = priceValid && selectedReason !== null;

  if (step === "done") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4 py-12 text-center space-y-6 pb-24">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-success text-success-foreground rounded-full flex items-center justify-center mx-auto"
        >
          <Check className="w-10 h-10" />
        </motion.div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Payment Received!</h2>
          <p className="text-sm text-muted-foreground mt-1">${adjustedPrice} from {job.customer}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service total</span>
            <span className="font-medium">${adjustedPrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee (12%)</span>
            <span className="font-medium">-${(parseFloat(adjustedPrice) * 0.12).toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Your earnings</span>
            <span>${(parseFloat(adjustedPrice) * 0.88).toFixed(2)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Payout will arrive within 1–2 business days</p>
        <button
          onClick={onDone}
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform"
        >
          Back to Jobs
        </button>
      </motion.div>
    );
  }

  if (step === "qr") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-8 text-center space-y-6 pb-24">
        <h2 className="font-display text-xl font-bold text-foreground">Show QR to Customer</h2>
        <p className="text-sm text-muted-foreground">Customer scans to confirm &amp; pay</p>

        <div className="w-64 h-64 bg-foreground rounded-3xl mx-auto flex items-center justify-center">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=blueokra-confirm-job123&bgcolor=FFFFFF"
            className="w-56 h-56 rounded-2xl mx-auto"
            alt="Payment QR code"
          />
        </div>

        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Amount</p>
          <p className="font-display text-2xl font-bold text-foreground">${adjustedPrice}</p>
          <p className="text-xs text-muted-foreground mt-1">{job.service} · {job.customer}</p>
        </div>

        <button
          onClick={() => setStep("done")}
          className="w-full bg-muted text-foreground font-medium py-3 rounded-2xl text-sm"
        >
          Customer confirmed manually
        </button>
      </motion.div>
    );
  }

  if (step === "adjust") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Adjust Final Price</h2>
          <p className="text-sm text-muted-foreground">Quoted range: ${QUOTE_LOW}–${QUOTE_HIGH}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-xs text-muted-foreground mb-2">Final amount</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-foreground">$</span>
            <input
              type="number"
              value={adjustedPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={handlePriceBlur}
              className="text-3xl font-bold font-display text-foreground bg-transparent outline-none w-24 text-center"
            />
          </div>
          {priceError && (
            <p className="text-xs text-destructive mt-2">{priceError}</p>
          )}
          {!priceError && priceValid && parsedPrice > QUOTE_HIGH && (
            <p className="text-xs text-accent mt-2">⚠️ Above quoted range — customer approval required</p>
          )}
          {!priceError && priceValid && parsedPrice <= QUOTE_HIGH && parsedPrice >= QUOTE_LOW && (
            <p className="text-xs text-secondary mt-2">✓ Within quoted range — auto-approved</p>
          )}
          {!priceError && priceValid && parsedPrice < QUOTE_LOW && parsedPrice >= 0 && (
            <p className="text-xs text-blue-500 mt-2">Below quoted range</p>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-sm">
          <h3 className="font-semibold text-sm mb-2">
            Reason for adjustment <span className="text-accent">*</span>
          </h3>
          {REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition-colors ${
                selectedReason === reason
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {reason}
            </button>
          ))}
          {selectedReason === null && (
            <p className="text-xs text-muted-foreground pt-1">Select a reason to continue</p>
          )}
        </div>

        <button
          onClick={() => setStep("qr")}
          disabled={!canProceedToQr}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Show QR Code <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  // Photos step
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Complete Job</h2>
        <p className="text-sm text-muted-foreground">{job.service} · {job.customer} · {job.address}</p>
      </div>

      {/* Checklist */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Completion Checklist</h3>
        {CHECKLIST_ITEMS.map((item, i) => (
          <label key={item.label} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkedItems[i]}
              onChange={() => toggleCheck(i)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-foreground">
              {item.label}
              {item.required && <span className="text-accent ml-1">*</span>}
            </span>
          </label>
        ))}
        {!allRequiredChecked && (
          <p className="text-xs text-muted-foreground pt-1">Complete all required items (*) to proceed</p>
        )}
      </div>

      {/* Photo upload */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Upload completion photos (optional)</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          hidden
          onChange={handleFileChange}
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted/80 transition-colors active:scale-[0.98]"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px]">Add</span>
          </button>
          {photos.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
              <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-foreground/70 text-background rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setStep("adjust")}
        disabled={!allRequiredChecked}
        className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next: Adjust Price <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default ProviderCompletion;
