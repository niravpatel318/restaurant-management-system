import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getOrders, updateOrderStatus } from "../services/api";

const statuses = ["All orders", "Pending", "Preparing", "Ready", "Completed", "Cancelled"];
const nextStatus = { Pending: "Preparing", Preparing: "Ready", Ready: "Completed" };

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState("All orders");
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    const refresh = useCallback(() => {
        getOrders().then(data => {
            setOrders(data);
            setError("");
        }).catch(e => setError(e.message)).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        refresh();
        const timer = window.setInterval(refresh, 12000);
        return () => window.clearInterval(timer);
    }, [refresh]);

    const counts = useMemo(() => ({
        Pending: orders.filter(order => order.status === "Pending").length,
        Preparing: orders.filter(order => order.status === "Preparing").length,
        Ready: orders.filter(order => order.status === "Ready").length
    }), [orders]);

    const visibleOrders = orders.filter(order => {
        const matchesStatus = filter === "All orders" || order.status === filter;
        const term = search.trim().toLowerCase();
        const matchesSearch = !term || String(order.id).includes(term) || order.customerName.toLowerCase().includes(term) || String(order.tableNumber).toLowerCase().includes(term);
        return matchesStatus && matchesSearch;
    });

    async function changeStatus(order, status) {
        setUpdating(order.id);
        try {
            await updateOrderStatus(order.id, status);
            setOrders(current => current.map(item => item.id === order.id ? { ...item, status } : item));
            setError("");
        } catch (e) {
            setError(e.message);
        } finally {
            setUpdating(null);
        }
    }

    return (
        <>
            <div className="page-heading orders-page-heading">
                <div><span className="eyebrow">LIVE KITCHEN</span><h1>Customer orders</h1><p>Orders from customer mode appear here automatically.</p></div>
                <button className="secondary orders-refresh" onClick={refresh}>↻ <span>Refresh</span></button>
            </div>

            {error && <div className="error">{error} <button className="inline-retry" onClick={refresh}>Try again</button></div>}

            <div className="order-stats">
                <div className="order-stat pending"><span className="order-stat-icon">◷</span><div><small>New orders</small><strong>{counts.Pending}</strong></div></div>
                <div className="order-stat preparing"><span className="order-stat-icon">♨</span><div><small>In the kitchen</small><strong>{counts.Preparing}</strong></div></div>
                <div className="order-stat ready"><span className="order-stat-icon">✓</span><div><small>Ready to serve</small><strong>{counts.Ready}</strong></div></div>
                <div className="order-live-note"><span className="live-dot"></span><span>Auto-refreshing every 12 seconds</span></div>
            </div>

            <div className="orders-toolbar">
                <div className="orders-tabs" role="tablist" aria-label="Filter orders">
                    {statuses.map(status => <button key={status} role="tab" aria-selected={filter === status} className={filter === status ? "orders-tab active" : "orders-tab"} onClick={() => setFilter(status)}>{status}{status === "Pending" && counts.Pending > 0 && <span>{counts.Pending}</span>}</button>)}
                </div>
                <label className="orders-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, table or order #" /></label>
            </div>

            {loading ? <div className="orders-empty panel"><span className="orders-empty-icon">◷</span><h2>Loading the order board…</h2><p>Fetching the latest customer orders.</p></div> : visibleOrders.length === 0 ? (
                <div className="orders-empty panel"><span className="orders-empty-icon">{orders.length ? "⌕" : "✓"}</span><h2>{orders.length ? "No orders match this view" : "The kitchen is quiet"}</h2><p>{orders.length ? "Try another status or search term." : "New customer orders will show up here as soon as they are placed."}</p></div>
            ) : (
                <div className="order-board">
                    {visibleOrders.map(order => <article className="order-card" key={order.id}>
                        <div className="order-card-top">
                            <div className="order-identity"><span className="order-number">#{String(order.id).padStart(4, "0")}</span><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></div>
                            <time>{new Date(order.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
                        </div>
                        <div className="order-customer"><div className="order-customer-avatar">{order.customerName.charAt(0).toUpperCase()}</div><div><strong>{order.customerName}</strong><small>Table {order.tableNumber}</small></div><div className="order-total"><small>Order total</small><strong>₹{Number(order.total).toFixed(2)}</strong></div></div>
                        <div className="order-card-items"><div className="order-items-label">ORDER ITEMS <span>{order.items.reduce((sum, item) => sum + Number(item.quantity), 0)} items</span></div>{order.items.map((item, index) => <div className="order-item-row" key={`${order.id}-${index}`}><span><b>{item.quantity}×</b> {item.name}</span><strong>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</strong></div>)}</div>
                        <div className="order-card-actions">
                            {nextStatus[order.status] ? <button className="primary order-action" disabled={updating === order.id} onClick={() => changeStatus(order, nextStatus[order.status])}>{updating === order.id ? "Saving…" : order.status === "Pending" ? "Start preparing" : order.status === "Preparing" ? "Mark ready" : "Mark completed"}<span>→</span></button> : <span className="order-finished-note">{order.status === "Cancelled" ? "This order was cancelled" : "Order completed"}</span>}
                            {order.status === "Pending" && <button className="order-cancel" disabled={updating === order.id} onClick={() => changeStatus(order, "Cancelled")}>Cancel order</button>}
                            {order.status === "Ready" && <button className="order-cancel" disabled={updating === order.id} onClick={() => changeStatus(order, "Cancelled")}>Cancel</button>}
                        </div>
                    </article>)}
                </div>
            )}
        </>
    );
}
