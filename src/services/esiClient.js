const axios = require('axios');
const db = require('../config/database');

class EsiClient {
  constructor() {
    this.baseUrl = 'https://esi.evetech.net/latest';
    this.userAgent = 'Eve Black Market - Market Data Sync';
  }

  async request(endpoint, options = {}) {
    const params = {
      datasource: 'tranquility',
      ...options.params
    };

    const url = `${this.baseUrl}${endpoint}`;
    try {
      // Check cache first
      const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
      const cachedData = await this.getCachedData(cacheKey);
      const headers = {
        'User-Agent': this.userAgent,
        ...options.headers
      };

      if (cachedData) {
        headers['If-None-Match'] = cachedData.etag;
      }

      try {
        const response = await axios.get(url, {
          ...options,
          params,
          headers,
          validateStatus: status => status < 500 // Allow 304 responses
        });

        // If we get a 304, use cached data
        if (response.status === 304 && cachedData) {
          console.log(`Cache hit for ${cacheKey}`);
          return {
            data: JSON.parse(cachedData.data),
            headers: response.headers
          };
        }

        // If we get new data, update cache
        if (response.status === 200) {
          const etag = response.headers.etag;
          if (etag) {
            await this.updateCache(cacheKey, etag, JSON.stringify(response.data));
          }
          return {
            data: response.data,
            headers: response.headers
          };
        }

        throw new Error(`Unexpected response status: ${response.status}`);
      } catch (error) {
        // If request fails but we have cached data, use it
        if (cachedData) {
          console.log(`Request failed, using cached data for ${cacheKey}`);
          return {
            data: JSON.parse(cachedData.data),
            headers: {} // Empty headers when using cached data
          };
        }
        throw error;
      }
    } catch (error) {
      console.error(`ESI request failed for ${url}:`, error.message);
      throw error;
    }
  }

  async getCachedData(url) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT etag, data, cached_at FROM esi_cache WHERE url = ?',
        [url],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async updateCache(url, etag, data) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO esi_cache (url, etag, data, cached_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [url, etag, data],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

module.exports = new EsiClient();
