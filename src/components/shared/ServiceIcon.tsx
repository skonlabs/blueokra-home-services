import { forwardRef } from "react";
import { Leaf, SprayCan, Home, Droplets, Wind, Wrench, Fence, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  lawn: Leaf,
  house_cleaning: SprayCan,
  gutter: Warehouse,
  roof: Home,
  pressure: Droplets,
  duct: Wind,
  backwater: Wrench,
  fence: Fence,
};

const colorMap: Record<string, string> = {
  lawn: "bg-okra-50 text-secondary",
  house_cleaning: "bg-blue-50 text-primary",
  gutter: "bg-warm-50 text-accent",
  roof: "bg-warm-50 text-accent",
  pressure: "bg-blue-50 text-primary",
  duct: "bg-blue-50 text-primary",
  backwater: "bg-okra-50 text-secondary",
  fence: "bg-okra-50 text-secondary",
};

interface ServiceIconProps {
  serviceType: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const iconSizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const ServiceIcon = forwardRef<HTMLDivElement, ServiceIconProps>(({ serviceType, size = "md", className }, ref) => {
  const Icon = iconMap[serviceType] || Wrench;
  const colors = colorMap[serviceType] || "bg-muted text-muted-foreground";

  return (
    <div ref={ref} className={cn("rounded-xl flex items-center justify-center shrink-0", sizeClasses[size], colors, className)}>
      <Icon className={iconSizeClasses[size]} />
    </div>
  );
});

export { iconMap, colorMap };
export default ServiceIcon;
