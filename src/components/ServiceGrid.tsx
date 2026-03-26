import { motion } from "framer-motion";

const services = [
  { id: "lawn", name: "Lawn & Garden", icon: "🌿", description: "Mowing, trimming, landscaping", color: "bg-okra-50 border-okra-100" },
  { id: "hvac", name: "HVAC", icon: "❄️", description: "Heating, cooling, air quality", color: "bg-blue-50 border-blue-100" },
  { id: "plumbing", name: "Plumbing", icon: "🔧", description: "Leaks, drains, installations", color: "bg-blue-50 border-blue-100" },
  { id: "pressure", name: "Pressure Wash", icon: "💧", description: "Driveways, siding, decks", color: "bg-blue-50 border-blue-100" },
  { id: "roof", name: "Roof Cleaning", icon: "🏠", description: "Moss, debris, gutters", color: "bg-warm-50 border-warm-100" },
  { id: "electrical", name: "Electrical", icon: "⚡", description: "Wiring, outlets, fixtures", color: "bg-warm-50 border-warm-100" },
  { id: "handyman", name: "Handyman", icon: "🛠️", description: "Repairs, assembly, odd jobs", color: "bg-okra-50 border-okra-100" },
];

interface ServiceGridProps {
  onSelect: (serviceId: string) => void;
}

const ServiceGrid = ({ onSelect }: ServiceGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {services.map((service, i) => (
        <motion.button
          key={service.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          onClick={() => onSelect(service.id)}
          className={`flex flex-col items-start gap-2 p-4 rounded-2xl border ${service.color} text-left service-card-hover active:scale-[0.97] transition-transform`}
        >
          <span className="text-2xl">{service.icon}</span>
          <div>
            <p className="font-semibold text-sm text-foreground">{service.name}</p>
            <p className="text-xs text-muted-foreground leading-tight">{service.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default ServiceGrid;
