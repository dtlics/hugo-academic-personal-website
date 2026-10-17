// The 3D scene builds its works in this fixed order. Display order lives in
// src/data/exhibition.json; each entry names its station.
export const STATION_IDS = ['fermionic', 'logical', 'optimization', 'gradient', 'transformer', 'measurement'] as const;
export const stationIndex = (station: string) => STATION_IDS.indexOf(station as (typeof STATION_IDS)[number]);
