import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteFood, getFoods } from "../services/api";

export default function FoodList() {
    const [foods, setFoods] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    function load() {
        getFoods().then(setFoods).catch(e => setError(e.message));
    }

    useEffect(load, []);

    function remove(id) {
        if (!window.confirm("Delete this food item?")) return;
        deleteFood(id).then(data => {
            setMessage(data.message);
            setError("");
            load();
        }).catch(e => setError(e.message));
    }

    const list = foods.filter(food =>
        food.name.toLowerCase().includes(search.toLowerCase()) &&
        (category === "All" || food.category === category)
    );

    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">MENU</span>
                    <h1>Food Items</h1>
                    <p>View, add, edit and delete items from your restaurant menu.</p>
                </div>
                <Link to="/add-food" className="primary">+ Add Food</Link>
            </div>

            {message && <div className="success">{message}</div>}
            {error && <div className="error">{error}</div>}

            <div className="filter-panel">
                <div className="search-box">
                    <span>⌕</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search food name..." />
                </div>
                <div className="category-box">
                    <label>Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                        <option>All</option>
                        <option>Veg</option>
                        <option>Non-Veg</option>
                        <option>Drinks</option>
                    </select>
                </div>
                <div className="result-count"><strong>{list.length}</strong><span>Items</span></div>
            </div>

            <div className="panel table-panel">
                {list.length === 0 ? (
                    <div className="empty"><div className="empty-icon">▤</div><h3>No food items found</h3><p>Try another search or add a new food item.</p></div>
                ) : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr><th>Food Item</th><th>Price</th><th>Category</th><th>Quantity</th><th>Description</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {list.map(food => (
                                    <tr key={food.id}>
                                        <td>
                                            <div className="food-name-cell">
                                                <span className="food-avatar">{food.name.charAt(0).toUpperCase()}</span>
                                                <div><strong>{food.name}</strong><small>ID: {food.id}</small></div>
                                            </div>
                                        </td>
                                        <td><strong>₹{Number(food.price).toFixed(2)}</strong></td>
                                        <td><span className={"badge " + food.category.toLowerCase().replace("-", "")}>{food.category}</span></td>
                                        <td><span className="quantity-value">{food.quantity}</span></td>
                                        <td><span className="description-cell">{food.description}</span></td>
                                        <td>
                                            <div className="actions">
                                                <Link className="action-button edit" to={"/edit-food/" + food.id}>Edit</Link>
                                                <button className="action-button delete" onClick={() => remove(food.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
