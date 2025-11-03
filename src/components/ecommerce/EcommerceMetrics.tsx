import { useEffect, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { DashboardService, DashboardStats } from "../../services/dashboard/dashboard.services";

export default function EcommerceMetrics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
          <div className="h-12 w-12 bg-gray-200 rounded-xl mb-5"></div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
          <div className="h-12 w-12 bg-gray-200 rounded-xl mb-5"></div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Customers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats ? formatNumber(stats.customers.total) : '0'}
            </h4>
          </div>
          {stats && (
            <Badge color={stats.customers.isPositive ? "success" : "error"}>
              {stats.customers.isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(stats.customers.change).toFixed(2)}%
            </Badge>
          )}
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Delivered Orders
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats ? formatNumber(stats.orders.total) : '0'}
            </h4>
          </div>
          {stats && (
            <Badge color={stats.orders.isPositive ? "success" : "error"}>
              {stats.orders.isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(stats.orders.change).toFixed(2)}%
            </Badge>
          )}
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
