import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";
import blueokraLogo from "@/assets/blueokra-logo.svg";

interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  rightActions?: ReactNode;
}

const ScreenHeader = ({ title, onBack, rightActions }: ScreenHeaderProps) => (
  <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
    {/* Always-visible brand bar */}
    <div className="px-4 pt-12 pb-2.5 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <img src={blueokraLogo} alt="BlueOkra" className="w-6 h-6" aria-hidden="true" />
        <span className="font-display text-sm font-semibold tracking-tight text-gradient-primary">
          BlueOkra<sup className="text-[8px] text-primary align-super">®</sup>
        </span>
        <span className="text-[9px] font-medium text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full leading-none ml-0.5">beta</span>
      </div>
      {rightActions && <div className="flex gap-2">{rightActions}</div>}
    </div>

    {/* Optional page title bar */}
    {title && (
      <div className="px-4 pb-3 flex items-center gap-2 border-t border-border/30">
        {onBack && (
          <button
            onClick={onBack}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
          </button>
        )}
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
      </div>
    )}
  </div>
);

export default ScreenHeader;
