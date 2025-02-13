const MarketDataSync = require('../src/services/marketDataSync');

async function main() {
    try {
        const sync = new MarketDataSync();
        console.log('Starting market items update...');
        await sync.updateMarketItems();
        console.log('Market items update completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating market items:', error);
        process.exit(1);
    }
}

main();
