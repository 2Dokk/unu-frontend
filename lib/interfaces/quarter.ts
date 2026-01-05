export interface QuarterResponse {
  id: number;
  name: string;
  year: number;
  season: string;
  startDate: string;
}

export interface QuarterRequest {
  year: number;
  season: string;
  startDate: string;
  endDate: string;
}

export const QUARTER_ICON_MAP = {
  Spring: "🌸",
  Summer: "☀️",
  Fall: "🍂",
  Winter: "❄️",
};
