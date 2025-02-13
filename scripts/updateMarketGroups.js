const MarketDataSync = require('../src/services/marketDataSync');

async function main() {
    try {
        const sync = new MarketDataSync();
        console.log('Starting market groups update...');
        await sync.updateMarketGroups();
        console.log('Market groups update completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating market groups:', error);
        process.exit(1);
    }
}

main();
