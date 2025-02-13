class MarketBrowser {
    constructor() {
        this.currentGroupId = null;
        this.loadedCategories = new Map();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                await this.loadRootCategories();
            } catch (error) {
                console.error('Failed to initialize market browser:', error);
                this.showError('Failed to load market categories');
            }
        });
    }

    async loadRootCategories() {
        try {
            const response = await fetch('/market/categories');
            const categories = await response.json();
            await this.displayCategories(categories);
        } catch (error) {
            console.error('Error loading root categories:', error);
            this.showError('Failed to load categories');
        }
    }

    async loadSubcategories(groupId) {
        if (this.loadedCategories.has(groupId)) {
            return this.loadedCategories.get(groupId);
        }

        try {
            const response = await fetch(`/market/categories/${groupId}/subcategories`);
            const subcategories = await response.json();
            this.loadedCategories.set(groupId, subcategories);
            return subcategories;
        } catch (error) {
            console.error('Error loading subcategories:', error);
            return [];
        }
    }

    async loadCategoryItems(groupId) {
        try {
            const container = document.getElementById('market-content');
            container.innerHTML = '<div class="loading">Loading items</div>';

            const response = await fetch(`/market/categories/${groupId}/items`);
            const items = await response.json();

            // Log the response for debugging
            console.log('Items response:', items);

            // Check if items is an array
            if (Array.isArray(items)) {
                this.displayItems(items);
            } else {
                throw new Error('Invalid items response');
            }
        } catch (error) {
            console.error('Error loading items:', error);
            this.showError('Failed to load items');
        }
    }

    async displayCategories(categories) {
        const container = document.getElementById('category-tree');
        container.innerHTML = '';

        for (const category of categories) {
            const treeItem = await this.createTreeItem(category);
            container.appendChild(treeItem);
        }
    }

    async createTreeItem(category) {
        const item = document.createElement('div');
        item.className = 'tree-item';
        item.dataset.groupId = category.group_id;

        const content = document.createElement('div');
        content.className = 'tree-content';

        const toggle = document.createElement('span');
        toggle.className = 'toggle';
        toggle.textContent = '+';

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = category.name;

        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = `(${category.item_count || 0})`;

        content.appendChild(toggle);
        content.appendChild(name);
        content.appendChild(count);
        item.appendChild(content);

        const children = document.createElement('div');
        children.className = 'tree-children';
        item.appendChild(children);

        // Event listeners
        toggle.addEventListener('click', async (e) => {
            e.stopPropagation();
            const isExpanded = item.classList.contains('expanded');
        
            if (!isExpanded) {
                // Load subcategories
                const subcategories = await this.loadSubcategories(category.group_id);
                console.log('Loaded subcategories:', subcategories); // Log for debugging
                if (subcategories.length > 0) {
                    children.innerHTML = '';
                    for (const subcat of subcategories) {
                        const subItem = await this.createTreeItem(subcat);
                        children.appendChild(subItem);
                    }
                }
        
                // Load items for the parent category and display them as child nodes
                const items = await this.loadCategoryItems(category.group_id);
                console.log('Loaded items:', items); // Log for debugging
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        const itemNode = document.createElement('div');
                        itemNode.className = 'tree-item';
                        itemNode.innerHTML = `<span class='name'>${item.name}</span>`;
                        children.appendChild(itemNode);
                    });
                }
        
                toggle.textContent = '-';
                item.classList.add('expanded');
            } else {
                toggle.textContent = '+';
                item.classList.remove('expanded');
            }
        });
        content.addEventListener('click', async () => {
            // Remove active class from all items
            document.querySelectorAll('.tree-item').forEach(el => {
                el.classList.remove('active');
            });

            // Add active class to clicked item
            item.classList.add('active');

            // Load items for this category
            await this.loadCategoryItems(category.group_id);
        });

        // Check if this category has subcategories or items
        const subcategories = await this.loadSubcategories(category.group_id);
        if (subcategories.length === 0) {
            if (category.item_count > 0) {
                toggle.textContent = '•';
            } else {
                toggle.textContent = '-';
            }
        }

        return item;
    }

    async displayItems(items) {
        const container = document.getElementById('market-content');
        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<div class="error-message">No items found in this category</div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'items-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Volume</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.volume}</td>
                        <td>${item.published ? 'Published' : 'Unpublished'}</td>
                        <td><button class='btn' data-item-id='${item.type_id}'>View Orders</button></td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        container.appendChild(table);

        // Add event listeners for order buttons
        const orderButtons = document.querySelectorAll('.btn[data-item-id]');
        orderButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const itemId = e.target.dataset.itemId;
                await this.loadItemOrders(itemId);
            });
        });
    }

    async loadItemOrders(itemId) {
        try {
            const container = document.getElementById('market-content');
            container.innerHTML = '<div class="loading">Loading orders</div>';

            const response = await fetch(`/market/items/${itemId}/orders`);
            const orders = await response.json();
            this.displayOrders(orders);
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showError('Failed to load orders');
        }
    }

    displayOrders(orders) {
        const container = document.getElementById('market-content');
        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = '<div class="error-message">No orders found for this item</div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'orders-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.quantity}</td>
                        <td>${order.price}</td>
                        <td>${order.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        container.appendChild(table);
    }

    showError(message) {
        const container = document.getElementById('market-content');
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// Initialize the market browser
const marketBrowser = new MarketBrowser();

document.getElementById('addOrderBtn').addEventListener('click', function() {
    document.getElementById('addOrderModal').style.display = 'block';
});

// Close the modal when the close button is clicked
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('addOrderModal').style.display = 'none';
});

// Handle form submission for adding new order
document.getElementById('addOrderForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission

    const itemName = document.getElementById('itemName').value;
    const price = document.getElementById('price').value;
    const quantity = document.getElementById('quantity').value;
    const orderType = document.getElementById('orderType').value;

    try {
        const response = await fetch('/market/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemName, price, quantity, orderType })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Order added:', result);
            // Close the modal and reset the form
            document.getElementById('addOrderModal').style.display = 'none';
            document.getElementById('addOrderForm').reset();
        } else {
            throw new Error('Failed to add order');
        }
    } catch (error) {
        console.error('Error adding order:', error);
        alert('Failed to add order. Please try again.');
    }
});
