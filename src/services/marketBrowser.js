const db = require('../config/database');

class MarketBrowser {
    // Get root categories (those without parent_group_id)
    async getRootCategories() {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT g.group_id, g.name, g.description,
                        COUNT(DISTINCT i.type_id) as item_count
                 FROM market_groups g
                 LEFT JOIN market_items i ON i.market_group_id = g.group_id
                 WHERE g.parent_group_id IS NULL 
                 GROUP BY g.group_id
                 ORDER BY g.name`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Get subcategories for a given parent category
    async getSubcategories(parentGroupId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT g.group_id, g.name, g.description,
                        COUNT(DISTINCT i.type_id) as item_count
                 FROM market_groups g
                 LEFT JOIN market_items i ON i.market_group_id = g.group_id
                 WHERE g.parent_group_id = ?
                 GROUP BY g.group_id
                 ORDER BY g.name`,
                [parentGroupId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Get items in a category
    async getCategoryItems(groupId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT i.type_id, i.name, i.volume, i.published,
                        COALESCE(
                            (SELECT COUNT(*) 
                             FROM market_items 
                             WHERE market_group_id = ?) > 0,
                            false
                        ) as has_items
                 FROM market_items i
                 WHERE i.market_group_id = ?
                 ORDER BY i.name`,
                [groupId, groupId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Get category details including parent info for breadcrumb
    async getCategoryBreadcrumb(groupId) {
        return new Promise((resolve, reject) => {
            db.all(
                `WITH RECURSIVE category_path AS (
                    SELECT group_id, name, parent_group_id, 0 as level
                    FROM market_groups
                    WHERE group_id = ?
                    
                    UNION ALL
                    
                    SELECT m.group_id, m.name, m.parent_group_id, cp.level + 1
                    FROM market_groups m
                    JOIN category_path cp ON m.group_id = cp.parent_group_id
                )
                SELECT group_id, name
                FROM category_path
                ORDER BY level DESC`,
                [groupId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Get orders for a specific item
    async getItemOrders(itemId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM orders WHERE item_id = ?`,
                [itemId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}

module.exports = new MarketBrowser();
