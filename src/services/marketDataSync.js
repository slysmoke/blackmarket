const db = require('../config/database');
const esiClient = require('./esiClient');

class MarketDataSync {
  constructor() {
    this.userAgent = 'Eve Black Market - Market Data Sync';
  }

  async updateMarketData() {
    try {
      console.log('Starting market data sync...');
      await this.updateMarketGroups();
      await this.updateMarketItems();
      console.log('Market data sync completed successfully');
    } catch (error) {
      console.error('Error during market data sync:', error);
      throw error;
    }
  }

  async updateMarketGroups() {
    try {
      console.log('Fetching market groups...');
      const { data: groupIds } = await esiClient.request('/markets/groups/');
      
      for (const groupId of groupIds) {
        const { data: groupDetails } = await esiClient.request(`/markets/groups/${groupId}/`);

        // Insert or update market group
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT OR REPLACE INTO market_groups 
            (group_id, name, description, parent_group_id, last_updated) 
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
              groupId,
              groupDetails.name,
              groupDetails.description || null,
              groupDetails.parent_group_id || null
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        // Insert type associations
        if (groupDetails.types && groupDetails.types.length > 0) {
          const stmt = db.prepare(
            'INSERT OR REPLACE INTO market_group_types (group_id, type_id) VALUES (?, ?)'
          );

          for (const typeId of groupDetails.types) {
            await new Promise((resolve, reject) => {
              stmt.run([groupId, typeId], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }

          stmt.finalize();
        }

        // Add delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      console.log(`Updated ${groupIds.length} market groups`);
    } catch (error) {
      console.error('Error updating market groups:', error);
      throw error;
    }
  }

  async updateMarketItems() {
    try {
      console.log('Fetching market items...');
      let updatedCount = 0;

      // Get first page to determine total pages
      const { data: firstPageData, headers } = await esiClient.request('/universe/types/', {
        params: { page: 1 }
      });

      // Get total pages from headers
      const totalPages = parseInt(headers['x-pages']);
      if (!totalPages) {
        throw new Error('Could not determine total pages from ESI response');
      }

      console.log(`Found ${totalPages} pages of market items`);

      // Process first page data
      updatedCount = await this.processTypeIds(firstPageData, updatedCount);

      // Process remaining pages
      for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
        console.log(`Processing page ${currentPage} of ${totalPages}...`);
        
        const { data: typeIds } = await esiClient.request('/universe/types/', {
          params: { page: currentPage }
        });

        updatedCount = await this.processTypeIds(typeIds, updatedCount);

        // Add a small delay between pages to avoid rate limits
        if (currentPage < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`Updated ${updatedCount} market items`);
    } catch (error) {
      console.error('Error updating market items:', error);
      throw error;
    }
  }

  async processTypeIds(typeIds, count = 0) {
    for (const typeId of typeIds) {
      try {
        const { data: itemDetails } = await esiClient.request(`/universe/types/${typeId}/`);

        // Store all items, even those without market_group_id
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT OR REPLACE INTO market_items 
            (type_id, name, market_group_id, published, volume, last_updated) 
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
              typeId,
              itemDetails.name,
              itemDetails.market_group_id || null,
              itemDetails.published ? 1 : 0,
              itemDetails.volume || 0
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        count++;
        if (count % 100 === 0) {
          console.log(`Processed ${count} items...`);
        }

        // Add delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing type ID ${typeId}:`, error.message);
        continue; // Skip this item and continue with the next one
      }
    }
    return count;
  }

  static scheduleSync(intervalHours = 24) {
    const sync = new MarketDataSync();
    
    // Run initial sync
    sync.updateMarketData().catch(console.error);

    // Schedule periodic sync
    setInterval(() => {
      sync.updateMarketData().catch(console.error);
    }, intervalHours * 60 * 60 * 1000);
  }
}

module.exports = MarketDataSync;
