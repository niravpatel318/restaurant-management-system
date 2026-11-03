const API = "http://localhost:5000/api";

async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}

export function getFoods() {
    return request(API + "/foods");
}

export function addFood(food) {
    return request(API + "/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food)
    });
}

export function updateFood(id, food) {
    return request(API + "/foods/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food)
    });
}

export function deleteFood(id) {
    return request(API + "/foods/" + id, {
        method: "DELETE"
    });
}

export function placeOrder(order) {
    return request(API + "/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
    });
}

export function getOrders() {
    return request(API + "/orders");
}

export function updateOrderStatus(id, status) {
    return request(API + "/orders/" + id + "/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    });
}
