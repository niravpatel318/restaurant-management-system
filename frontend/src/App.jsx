import React, { useState } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import FoodList from "./pages/FoodList";
import FoodForm from "./pages/FoodForm";
import Billing from "./pages/Billing";
import Customer from "./pages/Customer";
import Orders from "./pages/Orders";

function Protected({ children }) {
    return localStorage.getItem("managerLogin") === "true"
        ? children
        : <Navigate to="/login" replace />;
}

function Layout() {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    function logout() {
        localStorage.removeItem("managerLogin");
        navigate("/login");
    }

    const links = [
        ["/", "Dashboard", "⌂"],
        ["/foods", "Food Items", "▤"],
        ["/add-food", "Add Food", "+"],
        ["/orders", "Customer Orders", "◷"],
        ["/billing", "Billing", "₹"]
    ];

    return (
        <div className="app">
            <aside className={open ? "sidebar open" : "sidebar"}>
                <div className="brand">
                    <div className="brand-mark">R</div>
                    <div className="brand-text">
                        <strong>Restaurant</strong>
                        <span>Management</span>
                    </div>
                    <button className="close-menu" onClick={() => setOpen(false)}>×</button>
                </div>

                <div className="menu-title">MAIN MENU</div>

                <nav className="nav-list">
                    {links.map(function(item) {
                        const active = item[0] === "/"
                            ? location.pathname === "/"
                            : location.pathname === item[0] || location.pathname.startsWith(item[0] === "/foods" ? "/edit-food" : "__none__");

                        return (
                            <Link
                                key={item[0]}
                                to={item[0]}
                                onClick={() => setOpen(false)}
                                className={active ? "nav-item active" : "nav-item"}
                            >
                                <span className="nav-icon">{item[2]}</span>
                                <span>{item[1]}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-bottom">
                    <div className="manager-box">
                        <div className="avatar">M</div>
                        <div>
                            <strong>Manager</strong>
                            <span>Restaurant Manager</span>
                        </div>
                    </div>
                    <button className="logout" onClick={logout}>
                        <span>↪</span> Logout
                    </button>
                </div>
            </aside>

            {open && <div className="overlay" onClick={() => setOpen(false)}></div>}

            <section className="main">
                <header className="topbar">
                    <button className="menu-button" onClick={() => setOpen(true)}>☰</button>
                    <div className="topbar-title">
                        <strong>Restaurant Management</strong>
                        <span>Manager Panel</span>
                    </div>
                    <div className="topbar-right">
                        <span className="status-dot"></span>
                        <span>Manager</span>
                        <Link className="mode-switch" to="/customer">Customer mode <span>→</span></Link>
                    </div>
                </header>

                <main className="content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/foods" element={<FoodList />} />
                        <Route path="/add-food" element={<FoodForm />} />
                        <Route path="/edit-food/:id" element={<FoodForm />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/billing" element={<Billing />} />
                    </Routes>
                </main>
            </section>
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/customer" element={<Customer />} />
            <Route path="/*" element={<Layout />} />
        </Routes>
    );
}
