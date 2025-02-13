const express = require('express');
const router = express.Router();
const marketBrowser = require('../services/marketBrowser');
const Orders = require('../models/Order');

// Root categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await marketBrowser.getRootCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching root categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Subcategories of a specific category
router.get('/categories/:groupId/subcategories', async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const subcategories = await marketBrowser.getSubcategories(groupId);
        res.json(subcategories);
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({ error: 'Failed to fetch subcategories' });
    }
});

// Get items for a specific category
router.get('/categories/:groupId/items', async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const items = await marketBrowser.getCategoryItems(groupId);
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Category breadcrumb
router.get('/categories/:groupId/breadcrumb', async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const breadcrumb = await marketBrowser.getCategoryBreadcrumb(groupId);
        res.json(breadcrumb);
    } catch (error) {
        console.error('Error fetching category breadcrumb:', error);
        res.status(500).json({ error: 'Failed to fetch breadcrumb' });
    }
});

// Get orders for a specific item
router.get('/items/:itemId/orders', async (req, res) => {
    try {
        const itemId = parseInt(req.params.itemId);
        const orders = await marketBrowser.getItemOrders(itemId);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching item orders:', error);
        res.status(500).json({ error: 'Failed to fetch item orders' });
    }
});

router.post('/market/orders', async (req, res) => {
    try {
        const { itemName, price, quantity, orderType } = req.body;
        
        // Use the Orders model to create a new order
        const order = await Orders.create({
            itemName,
            price,
            quantity,
            orderType,
            createdAt: new Date()
        });

        res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

module.exports = router;
