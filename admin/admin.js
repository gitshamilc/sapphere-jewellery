import { supabase } from "../supabase_client.js";

class AdminPanel {
    constructor() {
        this.products = [];
        this.currentEditId = null;
        this.imageBase64 = null;
        this.init();
    }

    async init() {
        lucide.createIcons();
        this.setupEventListeners();
        await this.fetchProducts();

        if (supabase) {
            // Subscribe to realtime database table changes
            supabase
                .channel("schema-admin-changes")
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

    setupEventListeners() {
        const openBtn = document.getElementById("open-modal-btn");
        const closeBtn = document.getElementById("close-modal-btn");
        const cancelBtn = document.getElementById("cancel-modal-btn");
        const modal = document.getElementById("product-modal");
        const form = document.getElementById("product-form");
        const fileInput = document.getElementById("p-file");

        openBtn.addEventListener("click", () => this.openModal());
        closeBtn.addEventListener("click", () => this.closeModal());
        cancelBtn.addEventListener("click", () => this.closeModal());
        form.addEventListener("submit", (e) => this.handleSubmit(e));

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById("file-status").textContent = file.name;
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.imageBase64 = event.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                document.getElementById("file-status").textContent = "No file chosen";
                this.imageBase64 = null;
            }
        });
    }

    async fetchProducts() {
        try {
            if (!supabase) return;

            const { data, error } = await supabase
                .from("jewelry_products")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            this.products = data || [];
            this.renderProducts();
        } catch (err) {
            console.error("Fetch failed:", err);
        }
    }

    renderProducts() {
        const tbody = document.getElementById("admin-products-tbody");
        if (this.products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No products found. Add some to get started.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.products.map(p => `
            <tr>
                <td>
                    <div class="admin-prod-cell">
                        <img src="${p.img || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80'}" alt="" class="admin-thumb" onerror="this.src='https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80'">
                        <div>
                            <div class="admin-name">${p.name}</div>
                            <div class="admin-id">ID: ${p.id}</div>
                        </div>
                    </div>
                </td>
                <td><span class="category">${p.cat.toUpperCase()}</span></td>
                <td><strong>₹${Number(p.price).toLocaleString('en-IN')}</strong></td>
                <td><span class="badge">${p.badge || '-'}</span></td>
                <td>
                    <div class="row-actions">
                        <button class="action-icon-btn edit-btn-trigger" data-id="${p.id}"><i data-lucide="edit-3"></i></button>
                        <button class="action-icon-btn delete delete-btn-trigger" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
                    </div>
                </td>
            </tr>
        `).join("");

        lucide.createIcons();

        // Attach action events dynamically
        tbody.querySelectorAll(".edit-btn-trigger").forEach(btn => {
            btn.addEventListener("click", () => this.editProduct(btn.dataset.id));
        });

        tbody.querySelectorAll(".delete-btn-trigger").forEach(btn => {
            btn.addEventListener("click", () => this.deleteProduct(btn.dataset.id));
        });
    }

    openModal(product = null) {
        const modal = document.getElementById("product-modal");
        const form = document.getElementById("product-form");
        const title = document.getElementById("modal-title");

        form.reset();
        document.getElementById("file-status").textContent = "No file chosen";
        this.imageBase64 = null;

        if (product) {
            this.currentEditId = product.id;
            title.textContent = "Edit Product";
            document.getElementById("product-id").value = product.id;
            document.getElementById("p-name").value = product.name;
            document.getElementById("p-cat").value = product.cat;
            document.getElementById("p-price").value = product.price;
            document.getElementById("p-badge").value = product.badge || "";
            document.getElementById("p-img").value = product.img || "";
            document.getElementById("p-desc").value = product.description || "";
        } else {
            this.currentEditId = null;
            title.textContent = "Add Product";
            document.getElementById("product-id").value = "";
        }

        modal.classList.add("active");
    }

    closeModal() {
        document.getElementById("product-modal").classList.remove("active");
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (!supabase) return;

        const name = document.getElementById("p-name").value.trim();
        const cat = document.getElementById("p-cat").value;
        const price = Number(document.getElementById("p-price").value);
        const badge = document.getElementById("p-badge").value.trim();
        const inputImgUrl = document.getElementById("p-img").value.trim();
        const description = document.getElementById("p-desc").value.trim();

        // Priority for image storage upload path, fallback to URL input field
        const img = this.imageBase64 || inputImgUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80';

        try {
            if (this.currentEditId) {
                // Update product row
                const { error } = await supabase
                    .from("jewelry_products")
                    .update({ name, cat, price, badge, img, description })
                    .eq("id", this.currentEditId);

                if (error) throw error;
            } else {
                // Generate primary key ID slug
                const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 10000);
                const { error } = await supabase
                    .from("jewelry_products")
                    .insert([{ id, name, cat, price, badge, img, description }]);

                if (error) throw error;
            }

            this.closeModal();
            await this.fetchProducts();
        } catch (err) {
            alert("Save operation failed: " + err.message);
        }
    }

    async editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            this.openModal(product);
        }
    }

    async deleteProduct(id) {
        if (!supabase) return;
        if (!confirm("Are you sure you want to permanently delete this product?")) return;

        try {
            const { error } = await supabase
                .from("jewelry_products")
                .delete()
                .eq("id", id);

            if (error) throw error;
            await this.fetchProducts();
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    new AdminPanel();
});
