import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFoods, placeOrder } from "../services/api";

export default function Customer() {
    const [foods, setFoods] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [tableNumber, setTableNumber] = useState("");
    const [placingOrder, setPlacingOrder] = useState(false);

    useEffect(() => {
        getFoods().then(setFoods).catch(e => setError(e.message));
    }, []);

    const categories = ["All", ...new Set(foods.map(food => food.category))];
    const visibleFoods = foods.filter(food =>
        food.name.toLowerCase().includes(search.toLowerCase()) &&
        (category === "All" || food.category === category)
    );
    const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price) * item.cartQuantity, 0), [cart]);
    const itemCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

    function adjust(food, amount) {
        setNotice("");
        setCart(current => {
            const existing = current.find(item => item.id === food.id);
            if (!existing && amount > 0) return [...current, { ...food, cartQuantity: 1 }];
            if (existing && amount > 0 && existing.cartQuantity >= Number(food.quantity)) return current;
            return current.map(item => item.id === food.id
                ? { ...item, cartQuantity: item.cartQuantity + amount }
                : item
            ).filter(item => item.cartQuantity > 0);
        });
    }

    function cartQuantity(id) {
        return cart.find(item => item.id === id)?.cartQuantity || 0;
    }

    async function submitOrder() {
        if (!cart.length || placingOrder) return;
        if (!customerName.trim() || !tableNumber.trim()) {
            setError("Please enter your name and table number to place your order.");
            return;
        }
        setError("");
        setPlacingOrder(true);
        try {
            const result = await placeOrder({
                customerName: customerName.trim(),
                tableNumber: tableNumber.trim(),
                items: cart.map(item => ({ id: item.id, quantity: item.cartQuantity }))
            });
            setNotice(`${result.message} Order #${result.orderId}.`);
            setCart([]);
            getFoods().then(setFoods).catch(() => {});
        } catch (e) {
            setError(e.message);
            getFoods().then(setFoods).catch(() => {});
        } finally {
            setPlacingOrder(false);
        }
    }

    return (
        <div className="customer-page">
            <header className="customer-header">
                <Link to="/customer" className="customer-brand">
                    <span className="brand-mark">R</span>
                    <span><strong>Rasa</strong><small>RESTAURANT</small></span>
                </Link>
                <nav className="customer-nav"><a href="#menu">Menu</a><a href="#about">Our kitchen</a></nav>
                <Link className="mode-switch" to="/">Manager mode <span>→</span></Link>
            </header>

            <main>
                <section className="customer-hero" id="about">
                    <div className="customer-hero-copy">
                        <span className="eyebrow">MADE FRESH, SERVED WITH HEART</span>
                        <h1>A little something<br />delicious awaits.</h1>
                        <p>Find your new favourite from our kitchen. Browse the menu and add your picks to your order.</p>
                        <a className="primary" href="#menu">Explore the menu <span>↓</span></a>
                    </div>
                    <div className="hero-art" aria-hidden="true"><span>✦</span><div className="hero-plate">🍲</div><small>FRESH FROM OUR KITCHEN</small></div>
                    <div className="hero-note">GOOD FOOD<br /><strong>GOOD MOOD</strong></div>
                </section>

                <section className="customer-menu-section" id="menu">
                    <div className="customer-section-heading">
                        <div><span className="eyebrow">THE GOOD STUFF</span><h2>Explore our menu</h2><p>Thoughtfully made and ready for you.</p></div>
                        <span className="menu-count">{foods.length} <small>menu items</small></span>
                    </div>
                    {error && <div className="error">{error}</div>}
                    {notice && <div className="success">{notice}</div>}
                    <div className="customer-toolbar">
                        <label className="customer-search"><span>⌕</span><input aria-label="Search menu" value={search} onChange={e => setSearch(e.target.value)} placeholder="What are you craving?" /></label>
                        <div className="category-pills" aria-label="Filter by category">
                            {categories.map(item => <button key={item} className={category === item ? "category-pill active" : "category-pill"} onClick={() => setCategory(item)}>{item}</button>)}
                        </div>
                    </div>

                    <div className="customer-layout">
                        <div className="customer-food-grid">
                            {visibleFoods.length ? visibleFoods.map((food, index) => {
                                const quantity = cartQuantity(food.id);
                                return <article className="customer-food-card" key={food.id}>
                                    <div className={`customer-food-art art-${index % 4}`}><span className={`badge ${food.category.toLowerCase().replace("-", "")}`}>{food.category}</span><span className="dish-emoji">{food.category === "Drinks" ? "🥤" : food.category === "Non-Veg" ? "🍗" : "🍛"}</span></div>
                                    <div className="customer-food-info"><div className="food-title-price"><h3>{food.name}</h3><strong>₹{Number(food.price).toFixed(2)}</strong></div><p>{food.description}</p><div className="customer-card-bottom"><span>{Number(food.quantity) > 0 ? `${food.quantity} available` : "Sold out"}</span>{quantity ? <div className="quantity"><button aria-label={`Remove one ${food.name}`} onClick={() => adjust(food, -1)}>−</button><b>{quantity}</b><button aria-label={`Add one ${food.name}`} disabled={quantity >= Number(food.quantity)} onClick={() => adjust(food, 1)}>+</button></div> : <button className="customer-add" disabled={Number(food.quantity) < 1} onClick={() => adjust(food, 1)}>{Number(food.quantity) > 0 ? <>Add <span>+</span></> : "Sold out"}</button>}</div></div>
                                </article>;
                            }) : <div className="customer-empty"><span>⌕</span><h3>No dishes found</h3><p>Try a different search or category.</p></div>}
                        </div>

                        <aside className="customer-cart">
                            <div className="cart-heading"><div><span className="eyebrow">YOUR PICKS</span><h3>Your order</h3></div><span className="cart-count">{itemCount}</span></div>
                            {!cart.length ? <div className="cart-empty"><span>♡</span><strong>Your order starts here</strong><p>Add something tasty from the menu.</p></div> : <div className="cart-lines">{cart.map(item => <div className="cart-line" key={item.id}><div><strong>{item.name}</strong><small>₹{Number(item.price).toFixed(2)} each</small></div><div className="cart-controls"><button aria-label={`Remove one ${item.name}`} onClick={() => adjust(item, -1)}>−</button><span>{item.cartQuantity}</span><button aria-label={`Add one ${item.name}`} onClick={() => adjust(item, 1)}>+</button></div><strong className="cart-line-total">₹{(Number(item.price) * item.cartQuantity).toFixed(2)}</strong></div>)}</div>}
                            {cart.length > 0 && <div className="cart-customer-fields">
                                <label>Your name<input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Name for the order" maxLength="100" /></label>
                                <label>Table number<input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="e.g. 4" maxLength="20" /></label>
                            </div>}
                            <div className="cart-total"><span>Subtotal</span><strong>₹{total.toFixed(2)}</strong></div>
                            <button className="primary cart-checkout" disabled={!cart.length || placingOrder} onClick={submitOrder}>{placingOrder ? "Sending order…" : "Place order"} <span>→</span></button>
                            <small className="cart-footnote">Your order goes straight to the restaurant team.</small>
                        </aside>
                    </div>
                </section>
            </main>
            <footer className="customer-footer"><span>Rasa <small>GOOD FOOD, GOOD COMPANY.</small></span><span>Made fresh, just for you.</span></footer>
        </div>
    );
}
