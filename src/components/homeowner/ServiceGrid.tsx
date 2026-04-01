import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Leaf, SprayCan, Warehouse, Home, Droplets, Wind, Wrench, Fence } from "lucide-react";

const services = [
  { id: "lawn", name: "Lawn & Garden", icon: Leaf, description: "Mowing, trimming, landscaping", color: "bg-secondary/5 border-secondary/20", iconColor: "text-secondary" },
  { id: "house_cleaning", name: "House Cleaning", icon: SprayCan, description: "Deep clean, recurring, move-out", color: "bg-primary/5 border-primary/20", iconColor: "text-primary" },
  { id: "gutter", name: "Gutter Cleaning", icon: Warehouse, description: "Cleaning, guards, repairs", color: "bg-accent/5 border-accent/20", iconColor: "text-accent" },
  { id: "roof", name: "Roof Cleaning", icon: Home, description: "Moss, debris, gutters", color: "bg-accent/5 border-accent/20", iconColor: "text-accent" },
  { id: "pressure", name: "Pressure Wash", icon: Droplets, description: "Driveways, siding, decks", color: "bg-primary/5 border-primary/20", iconColor: "text-primary" },
  { id: "duct", name: "Duct Cleaning", icon: Wind, description: "Vents, dryer ducts, air quality", color: "bg-primary/5 border-primary/20", iconColor: "text-primary" },
  { id: "backwater", name: "Backwater Testing", icon: Wrench, description: "Testing, repair, certification", color: "bg-secondary/5 border-secondary/20", iconColor: "text-secondary" },
  { id: "fence", name: "Fence Installation", icon: Fence, description: "Install, repair, coating", color: "bg-secondary/5 border-secondary/20", iconColor: "text-secondary" },
];

export const getServiceById = (id: string) => services.find((s) => s.id === id);
export const getAllServices = () => services;

interface ServiceGridProps {
  onSelect: (serviceId: string) => void;
}

const ServiceGrid = forwardRef<HTMLDivElement, ServiceGridProps>(({ onSelect }, ref) => {
  return (
    <div ref={ref} className="grid grid-cols-2 gap-3">
      {services.map((service, i) => (
        <motion.button
          key={service.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          onClick={() => onSelect(service.id)}
          className={`flex flex-col items-start gap-2 p-4 rounded-2xl border ${service.color} text-left service-card-hover active:scale-[0.97] transition-transform`}
        >
          <div className={`w-9 h-9 rounded-xl bg-card/60 flex items-center justify-center ${service.iconColor}`}>
            <service.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{service.name}</p>
            <p className="text-xs text-muted-foreground leading-tight">{service.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
});
ServiceGrid.displayName = "ServiceGrid";

export default ServiceGrid;
