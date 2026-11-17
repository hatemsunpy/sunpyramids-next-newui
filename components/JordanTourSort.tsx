"use client";

import { useProgressRouter } from "@/components/useProgressRouter";
import { jordanCatalogHref, jordanTourOrders, type JordanTourOrder, type JordanTripType } from "@/lib/jordan-catalog-query";

export function JordanTourSort({ basePath, trip, order, label, options }: {
  basePath: string;
  trip: JordanTripType;
  order: JordanTourOrder;
  label: string;
  options: Record<JordanTourOrder, string>;
}) {
  const router = useProgressRouter();

  return (
    <label className="jordan-sort">
      <span>{label}</span>
      <select value={order} onChange={(event) => {
        const value = jordanTourOrders.find((option) => option === event.currentTarget.value);
        if (value) router.push(jordanCatalogHref(basePath, trip, value));
      }}>
        {jordanTourOrders.map((value) => <option key={value} value={value}>{options[value]}</option>)}
      </select>
    </label>
  );
}
