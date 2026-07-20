"use client";

import { useEffect } from "react";
import { addToSearchHistory } from "@/lib/storage";
import type { Car } from "@/types/car";

export function RecordHistory({ car }: { car: Car }) {
  useEffect(() => addToSearchHistory(car), [car]);
  return null;
}
