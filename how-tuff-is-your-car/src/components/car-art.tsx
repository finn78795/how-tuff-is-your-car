import { VehicleImage } from "@/components/vehicle-image";
import type { Car } from "@/types/car";

export function CarArt({ car, compact = false }: { car: Car; compact?: boolean }) {
  return <VehicleImage car={car} compact={compact} />;
}
