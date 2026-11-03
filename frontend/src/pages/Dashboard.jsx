import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFoods } from "../services/api";

export default function Dashboard() {
    const [foods, setFoods] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        getFoods().then(setFoods).catch(e => setError(e.message));
    }, []);

    const stats = [
        ["Total Food Items", foods.length, "▤", "menu"],
        ["Veg Items", foods.filter(x => x.category === "Veg").length, "V", "veg"],
        ["Non-Veg Items", foods.filter(x => x.category === "Non-Veg").length, "N", "nonveg"],
        ["Drinks", foods.filter(x => x.category === "Drinks").length, "D", "drinks"]
    ];

    const quantity = foods.reduce((a, x) => a + Number(x.quantity || 0), 0);

    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">OVERVIEW</span>
                    <h1>Dashboard</h1>
                    <p>Welcome back. Manage your restaurant menu and billing here.</p>
                </div>
                <Link to="/add-food" className="primary">+ Add Food</Link>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="stats">
                {stats.map(function(x) {
                    return (
                        <div className="stat" key={x[0]}>
                            <div className={"stat-icon " + x[3]}>{x[2]}</div>
                            <div className="stat-content">
                                <span>{x[0]}</span>
                                <strong>{x[1]}</strong>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="dashboard-grid">
                <div className="panel overview-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Restaurant Overview</h2>
                            <p>Quick information about your current menu.</p>
                        </div>
                        <span className="panel-mark">R</span>
                    </div>

                    <div className="overview-values">
                        <div className="overview-value">
                            <span>Available Quantity</span>
                            <strong>{quantity}</strong>
                            <small>Total quantity in menu</small>
                        </div>
                        <div className="overview-value">
                            <span>Menu Price Total</span>
                            <strong>₹{foods.reduce((a, x) => a + Number(x.price || 0), 0).toFixed(2)}</strong>
                            <small>Total of listed item prices</small>
                        </div>
                    </div>
                </div>

                <div className="panel quick-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Quick Actions</h2>
                            <p>Common manager tasks.</p>
                        </div>
                    </div>
                    <Link to="/foods" className="quick-link"><span>▤</span> View Food Items <b>→</b></Link>
                    <Link to="/orders" className="quick-link"><span>◷</span> View Customer Orders <b>→</b></Link>
                    <Link to="/add-food" className="quick-link"><span>+</span> Add New Food <b>→</b></Link>
                    <Link to="/billing" className="quick-link"><span>₹</span> Create Bill <b>→</b></Link>
                </div>
            </div>
        </>
    );
}
