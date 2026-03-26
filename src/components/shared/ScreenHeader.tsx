import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RightAction {
  icon: ReactNode;
  onClick: () => void;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Legacy: pass any ReactNode directly to the right side */
  rightAction?: ReactNode | RightAction;
}

/** Type guard to distinguish the new structured RightAction from a raw ReactNode */
const isRightAction = (value: unknown): value is RightAction =>
  typeof value === "object" &&
  value !== null &&
  "icon" in value &&
  "onClick" in value &&
  typeof (value as RightAction).onClick === "function";

/** Small BlueOkra wordmark shown when there is no back button */
const BlueOkraLogo = () => (
  <motion.div
    initial={{ opacity: 0, x: -4 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className="flex items-center gap-1.5 select-none"
    aria-label="BlueOkra"
  >
    {/* Okra pod mark */}
    <span className="text-base leading-none" role="img" aria-hidden="true">🫛</span>
    <span className="font-display text-sm font-semibold tracking-tight text-primary">
      BlueOkra
    </span>
  </motion.div>
);

const ScreenHeader = ({ title, subtitle, onBack, rightAction }: ScreenHeaderProps) => {
  const showLogo = !onBack;

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="px-4 pt-12 pb-3 flex items-center gap-3">
        {/* Left side: back button OR logo */}
        {onBack ? (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
        ) : (
          showLogo && <BlueOkraLogo />
        )}

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-base font-semibold text-foreground truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {/* Right side */}
        {rightAction && (
          isRightAction(rightAction) ? (
            <button
              onClick={rightAction.onClick}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              aria-label="Action"
            >
              {rightAction.icon}
            </button>
          ) : (
            <>{rightAction}</>
          )
        )}
      </div>
    </div>
  );
};

export default ScreenHeader;
