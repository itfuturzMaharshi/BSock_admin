import { useEffect, useState } from "react";
import {
  BoxIconLine,
  GroupIcon,
  DollarLineIcon,
  BoxIcon,
  BoltIcon,
} from "../../icons";
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      {/* <!-- Customers Card --> */}
      <div className="dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Customers
              </p>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {stats ? formatNumber(stats.customers.total) : '0'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {stats && stats.customers.today > 0 ? `${stats.customers.today} today` : 'Registered users'}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
            <GroupIcon className="text-blue-600 dark:text-blue-400 size-6" />
          </div>
        </div>
      </div>

      {/* <!-- Orders Card --> */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Orders
              </p>
            </div>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
              {stats ? formatNumber(stats.orders.total) : '0'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {stats && stats.orders.today > 0 ? `${stats.orders.today} today` : 'Total orders'}
            </p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl">
            <BoxIconLine className="text-indigo-600 dark:text-indigo-400 size-6" />
          </div>
        </div>
      </div>

      {/* <!-- Sales Card --> */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Sales
              </p>
            </div>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              {stats ? `$${formatNumber(stats.sales.total)}` : '$0'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {stats && stats.sales.today > 0 ? `$${formatNumber(stats.sales.today)} today` : 'Total sales'}
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
            <DollarLineIcon className="text-emerald-600 dark:text-emerald-400 size-6" />
          </div>
        </div>
      </div>

      {/* <!-- Products Card --> */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Products
              </p>
            </div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {stats ? formatNumber(stats.products.total) : '0'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {stats ? `${stats.products.active} active` : 'Total products'}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl">
            <BoxIcon className="text-purple-600 dark:text-purple-400 size-6" />
          </div>
        </div>
      </div>

      {/* <!-- Bids Card --> */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Active Bids
              </p>
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
              {stats ? formatNumber(stats.bids.active) : '0'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Currently active
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
            <BoltIcon className="text-amber-600 dark:text-amber-400 size-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
