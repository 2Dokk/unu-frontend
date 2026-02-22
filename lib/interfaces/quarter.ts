export interface QuarterResponse {
  id: string;
  name: string;
  year: number;
  season: string;
  startDate: string;
  endDate: string;
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
