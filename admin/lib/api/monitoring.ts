import { api } from "@/lib/api/client";
import type { Monitoring, MonitoringRange } from "@/lib/types";

export const fetchMonitoring = (range: MonitoringRange) =>
  api<Monitoring>("/api/admin/monitoring/widgets", { query: { range } });
