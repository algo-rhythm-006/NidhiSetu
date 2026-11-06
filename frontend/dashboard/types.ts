export type PeriodKey = "day" | "week" | "month" | "year";

export interface PeriodStats {
  tag: string;
  cur: [number, number, number, number];
  prev: [number, number, number, number];
}

export type TimeRangeKey = "Last Year" | "Last 6 Months" | "Last 3 Months";

export interface ChartDataRange {
  labels: string[];
  v: number[];
  base: number;
}

export interface ActivityItem {
  id: string;
  initials: string;
  avatarBg: string;
  badgeBg: string;
  badgeIcon: "check" | "plus" | "alert";
  name: string;
  action: string;
  time: string;
}

export interface FdrStatusItem {
  label: string;
  count: number;
}

