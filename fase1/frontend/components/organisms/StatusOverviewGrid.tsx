/**
 * StatusOverviewGrid - Organism component for displaying environmental status overview
 *
 * A responsive grid layout that displays multiple StatusCard components, providing
 * a comprehensive overview of environmental metrics. Part of the dashboard's main
 * status display section.
 *
 * This component manages local power state for each status card using React state.
 * The power state is not persisted and will reset on page reload or navigation.
 * Each StatusCard receives its own power state and a toggle handler.
 *
 * @param props - Component props
 * @param props.statusData - Array of status data objects containing metric information
 * @param props.onViewDetails - Optional callback function when a status card's details are viewed
 *
 * @returns A responsive grid of status cards
 *
 * @example
 * ```tsx
 * const statusData = [
 *   {
 *     id: "temperature",
 *     label: "Temperatura",
 *     value: "24.5°C",
 *     trend: "Normal",
 *     icon: Thermometer,
 *     color: "success"
 *   }
 * ];
 *
 * <StatusOverviewGrid
 *   statusData={statusData}
 *   onViewDetails={(id) => console.log("View details for:", id)}
 * />
 * ```
 */

import { ReactElement } from "react";
import { useState } from "react";
import StatusCard from "@/components/molecules/StatusCard";

interface StatusData {
  id: string;
  label: string;
  value: string;
  trend: string;
  icon: any; // Component reference, not ReactElement
  color: "success" | "warning" | "danger" | "primary";
}

interface StatusOverviewGridProps {
  statusData: StatusData[];
  onViewDetails?: (id: string) => void;
}

export default function StatusOverviewGrid({
  statusData,
  onViewDetails,
}: StatusOverviewGridProps) {
  // Local state for the power toggle of each sensor card.
  // This state is not persisted and will reset on reload or navigation.

   const [powerStates, setPowerStates] = useState<{ [id: string]: boolean }>(
    () => Object.fromEntries(statusData.map((s) => [s.id, true]))
  );
    /**
   * Handles toggling the power state for a specific status card.
   * @param id - The id of the status card to toggle.
   */

  const handleTogglePower = (id: string) => {
    setPowerStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-6 ">
      {statusData.map((status) => (
        <StatusCard
          key={status.id}
          label={status.label}
          value={status.value}
          trend={status.trend}
          icon={status.icon}
          color={status.color}
          onViewDetails={
            onViewDetails ? () => onViewDetails(status.id) : undefined
          }
          powerOn={powerStates[status.id]}
          onTogglePower={() => handleTogglePower(status.id)}
        />
      ))}
    </div>
  );
}
