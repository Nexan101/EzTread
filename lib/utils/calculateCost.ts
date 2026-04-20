import type { ShopServices, ShopTireRange } from "@/types/shop";

export interface CostBreakdown {
  tireCostPerTire: number;
  tireCostTotal: number;
  installPerTire: number;
  installTotal: number;
  grandTotal: number;
}

export function calculateCost(
  services: Partial<ShopServices>,
  tireRange: Partial<ShopTireRange>,
  qty = 4
): CostBreakdown {
  const avg =
    ((Number(tireRange.min_price) || 0) + (Number(tireRange.max_price) || 0)) /
    2;

  const installPerTire =
    (Number(services.mounting_balancing_per_tire) || 0) +
    (Number(services.valve_stems_per_tire) || 0) +
    (Number(services.disposal_per_tire) || 0) +
    (Number(services.tpms_per_tire) || 0);

  return {
    tireCostPerTire: avg,
    tireCostTotal: avg * qty,
    installPerTire,
    installTotal: installPerTire * qty,
    grandTotal: avg * qty + installPerTire * qty,
  };
}
