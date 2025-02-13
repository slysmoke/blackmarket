document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    const buyOrdersTable = document.getElementById('buyOrdersTable').getElementsByTagName('tbody')[0];
    const sellOrdersTable = document.getElementById('sellOrdersTable').getElementsByTagName('tbody')[0];

    // Load orders on page load and refresh every minute
    loadOrders();
    setInterval(loadOrders, 60000);

    // Set up form submission if form exists
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                item_name: document.getElementById('item_name').value,
                price: parseFloat(document.getElementById('price').value),
                quantity: parseInt(document.getElementById('quantity').value),
                order_type: document.getElementById('order_type').value,
                item_id: 0 // This would need to be populated from EVE Online API in a full implementation
            };

            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error('Failed to create order');
                }

                orderForm.reset();
                loadOrders(); // Refresh the orders list
            } catch (error) {
                console.error('Error creating order:', error);
                alert('Failed to create order. Please try again.');
            }
        });
    }

    // Function to load and display orders
    async function loadOrders() {
        try {
            const response = await fetch('/api/orders');
            const { buyOrders, sellOrders } = await response.json();

            // Update buy orders table
            buyOrdersTable.innerHTML = buyOrders.map(order => `
                <tr>
                    <td>${order.item_name}</td>
                    <td>${formatISK(order.price)}</td>
                    <td>${order.quantity}</td>
                    <td>${order.seller_name}</td>
                    <td>${formatDate(order.created_at)}</td>
                    <td class="expires-in" data-seconds="${order.seconds_remaining}">
                        ${formatTimeRemaining(order.seconds_remaining)}
                    </td>
                </tr>
            `).join('');

            // Update sell orders table
            sellOrdersTable.innerHTML = sellOrders.map(order => `
                <tr>
                    <td>${order.item_name}</td>
                    <td>${formatISK(order.price)}</td>
                    <td>${order.quantity}</td>
                    <td>${order.seller_name}</td>
                    <td>${formatDate(order.created_at)}</td>
                    <td class="expires-in" data-seconds="${order.seconds_remaining}">
                        ${formatTimeRemaining(order.seconds_remaining)}
                    </td>
                </tr>
            `).join('');

            // Show "No orders" message if tables are empty
            if (buyOrders.length === 0) {
                buyOrdersTable.innerHTML = '<tr><td colspan="6" class="no-orders">No buy orders available</td></tr>';
            }
            if (sellOrders.length === 0) {
                sellOrdersTable.innerHTML = '<tr><td colspan="6" class="no-orders">No sell orders available</td></tr>';
            }

            // Start countdown timer for expiration times
            startExpirationCountdown();
        } catch (error) {
            console.error('Error loading orders:', error);
            buyOrdersTable.innerHTML = '<tr><td colspan="6" class="error">Failed to load orders</td></tr>';
            sellOrdersTable.innerHTML = '<tr><td colspan="6" class="error">Failed to load orders</td></tr>';
        }
    }

    // Function to start countdown timer for expiration times
    function startExpirationCountdown() {
        const expirationElements = document.querySelectorAll('.expires-in');
        
        // Update expiration times every second
        const updateTimes = () => {
            expirationElements.forEach(element => {
                const seconds = parseInt(element.dataset.seconds);
                if (!isNaN(seconds)) {
                    const newSeconds = seconds - 1;
                    element.dataset.seconds = newSeconds;
                    element.textContent = formatTimeRemaining(newSeconds);
                }
            });
        };

        // Initial update
        updateTimes();

        // Update every second
        return setInterval(updateTimes, 1000);
    }

    // Helper function to format time remaining
    function formatTimeRemaining(seconds) {
        if (seconds <= 0) return 'Expired';

        const days = Math.floor(seconds / (24 * 3600));
        const hours = Math.floor((seconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    }

    // Helper function to format ISK values
    function formatISK(value) {
        return new Intl.NumberFormat('en-US').format(value) + ' ISK';
    }

    // Helper function to format dates
    function formatDate(dateString) {
        return new Date(dateString).toLocaleString();
    }
});
