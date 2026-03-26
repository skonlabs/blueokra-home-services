import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
}

const ScreenHeader = ({ title, subtitle, onBack, rightAction }: ScreenHeaderProps) => {
  return (
    <div className="px-4 pt-12 pb-3 flex items-center gap-3 border-b border-border bg-background sticky top-0 z-40">
      {onBack && (
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
      )}
      <div className="flex-1">
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {rightAction}
    </div>
  );
};

export default ScreenHeader;
