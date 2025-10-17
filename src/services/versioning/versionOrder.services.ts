import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

export interface OrderVersionHistoryQuery {
	orderId?: string;
	page: number;
	limit: number;
	changeType?: 'create' | 'update' | 'delete' | string;
	changedByType?: 'admin' | 'system' | string;
}

export interface OrderVersionGetQuery {
	orderId: string;
	version: number;
}

export interface OrderVersionRestoreBody extends OrderVersionGetQuery {
	changeReason: string;
}

export interface OrdersWithCountsQuery {
	page: number;
	limit: number;
}

export class VersionOrderService {
	static fetchHistory = async (body: OrderVersionHistoryQuery): Promise<any> => {
		const baseUrl = import.meta.env.VITE_BASE_URL;
		const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
		const url = `${baseUrl}/api/${adminRoute}/version/order/history`;
		try {
			const res = await api.post(url, body);
			return res.data;
		} catch (err: any) {
			const message = err.response?.data?.message || 'Failed to fetch order history';
			toastHelper.showTost(message, 'error');
			throw new Error(message);
		}
	};

	static fetchVersion = async (body: OrderVersionGetQuery): Promise<any> => {
		const baseUrl = import.meta.env.VITE_BASE_URL;
		const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
		const url = `${baseUrl}/api/${adminRoute}/version/order/get`;
		try {
			const res = await api.post(url, body);
			return res.data;
		} catch (err: any) {
			const message = err.response?.data?.message || 'Failed to fetch order version';
			toastHelper.showTost(message, 'error');
			throw new Error(message);
		}
	};

	static restoreVersion = async (body: OrderVersionRestoreBody): Promise<any> => {
		const baseUrl = import.meta.env.VITE_BASE_URL;
		const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
		const url = `${baseUrl}/api/${adminRoute}/version/order/restore`;
		try {
			const res = await api.post(url, body);
			toastHelper.showTost(res.data?.message || 'Restored order version successfully', 'success');
			return res.data;
		} catch (err: any) {
			const message = err.response?.data?.message || 'Failed to restore order version';
			toastHelper.showTost(message, 'error');
			throw new Error(message);
		}
	};

	static fetchOrdersWithCounts = async (body: OrdersWithCountsQuery): Promise<any> => {
		const baseUrl = import.meta.env.VITE_BASE_URL;
		const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
		const url = `${baseUrl}/api/${adminRoute}/version/orders-with-counts`;
		try {
			const res = await api.post(url, body);
			return res.data;
		} catch (err: any) {
			const message = err.response?.data?.message || 'Failed to fetch orders with counts';
			toastHelper.showTost(message, 'error');
			throw new Error(message);
		}
	};
}

export default VersionOrderService;


