import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addFood, getFoods, updateFood } from "../services/api";

const empty = { name: "", price: "", category: "", description: "", quantity: "" };

export default function FoodForm() {
    const [form, setForm] = useState(empty);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();
    const editing = Boolean(id);

    useEffect(() => {
        if (!editing) return;
        getFoods().then(foods => {
            const food = foods.find(x => String(x.id) === String(id));
            if (food) setForm({ name: food.name, price: food.price, category: food.category, description: food.description, quantity: food.quantity });
        }).catch(e => setErrors({ form: e.message }));
    }, [id, editing]);

    function change(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function clearForm() {
        setForm(empty);
        setErrors({});
    }

    function validate() {
        const e = {};
        if (!form.name.trim()) e.name = "Food name is required";
        if (Number(form.price) <= 0) e.price = "Price must be greater than 0";
        if (!form.category) e.category = "Please select a category";
        if (!form.description.trim()) e.description = "Description is required";
        if (form.quantity === "" || Number(form.quantity) < 0) e.quantity = "Quantity cannot be negative";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function submit(e) {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);

        const data = {
            name: form.name.trim(),
            price: Number(form.price),
            category: form.category,
            description: form.description.trim(),
            quantity: Number(form.quantity)
        };

        const request = editing ? updateFood(id, data) : addFood(data);
        request.then(() => navigate("/foods"))
            .catch(error => setErrors({ form: error.message }))
            .finally(() => setSaving(false));
    }

    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">MENU MANAGEMENT</span>
                    <h1>{editing ? "Edit Food Item" : "Add Food Item"}</h1>
                    <p>{editing ? "Update the details of this menu item." : "Enter the details to add a new food item."}</p>
                </div>
                <button className="secondary" onClick={() => navigate("/foods")}>← Back to Food Items</button>
            </div>

            <div className="form-layout">
                <div className="panel form-card">
                    <div className="form-card-title"><span className="form-mark">+</span><div><h2>Food Details</h2><p>Fill all required information below.</p></div></div>
                    {errors.form && <div className="error">{errors.form}</div>}

                    <form onSubmit={submit}>
                        <div className="form-grid">
                            <Field label="Food Name" name="name" value={form.name} change={change} error={errors.name} placeholder="Example: Paneer Tikka" />
                            <Field label="Price (₹)" name="price" type="number" value={form.price} change={change} error={errors.price} placeholder="Example: 180" />
                            <div className="field">
                                <label>Category</label>
                                <select name="category" value={form.category} onChange={change}>
                                    <option value="">Select Category</option>
                                    <option>Veg</option><option>Non-Veg</option><option>Drinks</option>
                                </select>
                                {errors.category && <small>{errors.category}</small>}
                            </div>
                            <Field label="Quantity" name="quantity" type="number" value={form.quantity} change={change} error={errors.quantity} placeholder="Example: 20" />
                        </div>

                        <div className="field">
                            <label>Description</label>
                            <textarea name="description" value={form.description} onChange={change} placeholder="Write a short description of the food item"></textarea>
                            {errors.description && <small>{errors.description}</small>}
                        </div>

                        <div className="form-buttons">
                            <button type="button" className="secondary" onClick={clearForm}>Clear</button>
                            <button type="button" className="secondary" onClick={() => navigate("/foods")}>Cancel</button>
                            <button className="primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save Changes" : "Add Food Item"}</button>
                        </div>
                    </form>
                </div>

                <div className="panel form-help">
                    <div className="help-icon">i</div>
                    <h3>Food Entry</h3>
                    <p>Use this form to maintain the restaurant food menu.</p>
                    <div className="help-row"><span>1</span><div><strong>Food Name</strong><small>Enter the item name.</small></div></div>
                    <div className="help-row"><span>2</span><div><strong>Price</strong><small>Enter price greater than zero.</small></div></div>
                    <div className="help-row"><span>3</span><div><strong>Category</strong><small>Select Veg, Non-Veg or Drinks.</small></div></div>
                    <div className="help-row"><span>4</span><div><strong>Quantity</strong><small>Enter available quantity.</small></div></div>
                </div>
            </div>
        </>
    );
}

function Field({ label, name, type = "text", value, change, error, placeholder }) {
    return (
        <div className="field">
            <label>{label}</label>
            <input type={type} name={name} value={value} onChange={change} placeholder={placeholder} />
            {error && <small>{error}</small>}
        </div>
    );
}
