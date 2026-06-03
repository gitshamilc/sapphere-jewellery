import { supabase } from "./supabase_client.js";

class Storefront {
    constructor() {
        this.products = [];
        this.init();
    }

    async init() {
        lucide.createIcons();
        await this.fetchProducts();

        if (supabase) {
            // Subscribe to realtime database table changes
            supabase
                .channel("schema-db-changes")
                .on(
                    "postgres_changes",
                    { event: "*", schema: "public", table: "jewelry_products" },
                    async () => {
                        await this.fetchProducts();
                    }
                )
                .subscribe();
        }
    }

    async fetchProducts() {
        const grid = document.getElementById("products-grid");
        try {
            if (!supabase) {
                grid.innerHTML = `<div class="error-state">Supabase Client connection config missing. Please set credentials in config.js.</div>`;
                return;
            }

            const { data, error } = await supabase
                .from("jewelry_products")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            this.products = data || [];
            this.render();
        } catch (err) {
            console.error("Fetch failed:", err);
            grid.innerHTML = `<div class="error-state">Failed to synchronize database records. Details: ${err.message}</div>`;
        }
    }

    render() {
        const grid = document.getElementById("products-grid");
        if (this.products.length === 0) {
            grid.innerHTML = `<div class="empty-state">No products are currently in the catalog. Open Dashboard to add your first product.</div>`;
            return;
        }

        grid.innerHTML = this.products.map(p => `
            <article class="product-card">
                <div class="card-img-container">
                    <img src="${p.img || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80'}" alt="${p.name}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80'">
                    ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
                </div>
                <div class="card-body">
                    <p class="category">${p.cat.toUpperCase()}</p>
                    <h3 class="title">${p.name}</h3>
                    <p class="description">${p.description || 'No description provided.'}</p>
                    <div class="footer-row">
                        <span class="price">₹${Number(p.price).toLocaleString('en-IN')}</span>
                        <a href="https://wa.me/918891071849?text=${encodeURIComponent('Hi SAPPHERE! I want to order the ' + p.name + ' - ₹' + Number(p.price).toLocaleString('en-IN'))}" target="_blank" class="buy-link">Order</a>
                    </div>
                </div>
            </article>
        `).join("");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    new Storefront();
});
