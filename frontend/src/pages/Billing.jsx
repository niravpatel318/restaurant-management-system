import React, { useEffect, useState } from "react";
import { getFoods } from "../services/api";

export default function Billing() {
    const [foods, setFoods] = useState([]);
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [message, setMessage] = useState("");

    useEffect(() => {
        getFoods().then(setFoods).catch(e => setMessage(e.message));
    }, []);

    const visible = foods.filter(food =>
        food.name.toLowerCase().includes(search.toLowerCase()) &&
        (category === "All" || food.category === category)
    );

    function add(food) {
        setSelected(list => {
            const found = list.find(x => x.id === food.id);
            if (found) return list.map(x => x.id === food.id ? { ...x, billQuantity: x.billQuantity + 1 } : x);
            return [...list, { ...food, billQuantity: 1 }];
        });
        setMessage("");
    }

    function change(food, amount) {
        setSelected(list => list.map(x => x.id === food.id ? { ...x, billQuantity: Math.max(0, x.billQuantity + amount) } : x).filter(x => x.billQuantity > 0));
    }

    function quantity(id) {
        const found = selected.find(x => x.id === id);
        return found ? found.billQuantity : 0;
    }

    const total = selected.reduce((sum, x) => sum + Number(x.price) * x.billQuantity, 0);

    function generate() {
        if (!selected.length) {
            setMessage("Please add at least one item to the bill.");
            return;
        }
        window.print();
    }

    return (
        <>
            <div className="page-heading no-print">
                <div>
                    <span className="eyebrow">BILLING</span>
                    <h1>Create Bill</h1>
                    <p>Select food items, set quantities and generate the bill.</p>
                </div>
            </div>

            {message && <div className="error no-print">{message}</div>}

            <div className="billing">
                <section className="menu-area no-print">
                    <div className="filter-panel billing-filter">
                        <div className="search-box">
                            <span>⌕</span>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search food name..." />
                        </div>
                        <select value={category} onChange={e => setCategory(e.target.value)}>
                            <option>All</option><option>Veg</option><option>Non-Veg</option><option>Drinks</option>
                        </select>
                    </div>

                    <div className="menu-grid">
                        {visible.map(food => {
                            const q = quantity(food.id);
                            return (
                                <div className="food-card" key={food.id}>
                                    <div className="food-top">
                                        <span className={"badge " + food.category.toLowerCase().replace("-", "")}>{food.category}</span>
                                        <strong>₹{Number(food.price).toFixed(2)}</strong>
                                    </div>
                                    <div className="food-card-icon">{food.name.charAt(0).toUpperCase()}</div>
                                    <h3>{food.name}</h3>
                                    <p>{food.description}</p>
                                    <div className="food-card-bottom">
                                        {q ? (
                                            <div className="quantity">
                                                <button onClick={() => change(food, -1)}>-</button>
                                                <b>{q}</b>
                                                <button onClick={() => change(food, 1)}>+</button>
                                            </div>
                                        ) : (
                                            <button className="primary small" onClick={() => add(food)}>Add</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="bill panel" id="bill">
                    <div className="bill-head">
                        <div className="bill-logo">R</div>
                        <h2>Restaurant Bill</h2>
                        <p>Restaurant Management</p>
                        <small>{new Date().toLocaleDateString()}</small>
                    </div>

                    {!selected.length ? (
                        <div className="empty bill-empty"><div className="empty-icon">₹</div><h3>Your bill is empty</h3><p>Add food items from the menu.</p></div>
                    ) : (
                        <>
                            <div className="bill-items">
                                {selected.map(food => (
                                    <div className="bill-row" key={food.id}>
                                        <div><strong>{food.name}</strong><small>₹{Number(food.price).toFixed(2)} × {food.billQuantity}</small></div>
                                        <strong>₹{(Number(food.price) * food.billQuantity).toFixed(2)}</strong>
                                    </div>
                                ))}
                            </div>
                            <div className="total"><span>Total Amount</span><strong>₹{total.toFixed(2)}</strong></div>
                        </>
                    )}

                    <div className="bill-buttons no-print">
                        <button className="secondary" onClick={() => setSelected([])}>Clear</button>
                        <button className="primary" onClick={generate}>Generate Bill</button>
                    </div>
                </section>
            </div>
        </>
    );
}
