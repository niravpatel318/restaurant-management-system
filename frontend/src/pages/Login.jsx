import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    function submit(e) {
        e.preventDefault();
        setError("");

        if (username === "manager" && password === "manager123") {
            localStorage.setItem("managerLogin", "true");
            navigate("/");
        } else {
            setError("Invalid username or password");
        }
    }

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="login-brand">
                    <div className="brand-mark large">R</div>
                    <div>
                        <strong>Restaurant</strong>
                        <span>Management System</span>
                    </div>
                </div>
                <div className="login-intro">
                    <div className="food-symbol">🍽</div>
                    <h1>Manage your restaurant<br />with ease.</h1>
                    <p>Manage food items, quantities and customer bills from one simple manager panel.</p>
                    <div className="login-points">
                        <span>✓ Food item management</span>
                        <span>✓ Category-wise menu</span>
                        <span>✓ Simple billing</span>
                    </div>
                </div>
            </div>

            <div className="login-right">
                <form className="login-card" onSubmit={submit}>
                    <div className="login-card-head">
                        <span className="mobile-logo">R</span>
                        <h2>Welcome Back</h2>
                        <p>Sign in as restaurant manager</p>
                    </div>

                    {error && <div className="error">{error}</div>}

                    <div className="field">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={function(e) { setUsername(e.target.value); }}
                            placeholder="Enter username"
                        />
                    </div>

                    <div className="field">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={function(e) { setPassword(e.target.value); }}
                            placeholder="Enter password"
                        />
                    </div>

                    <button className="primary login-button" type="submit">Login to Dashboard</button>

                    <div className="demo-box">
                        <span>login</span>
                        <strong>manager</strong>
                        <small>/</small>
                        <strong>manager123</strong>
                    </div>
                </form>
            </div>
        </div>
    );
}
