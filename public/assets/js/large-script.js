// Large JavaScript file for testing CDN minification and compression

// This file contains repetitive code patterns to test compression effectiveness

(function() {
    'use strict';

    // Large object with repetitive data for compression testing
    const testData = {
        users: [],
        products: [],
        categories: [],
        orders: [],
        reviews: []
    };

    // Generate test users
    for (let i = 1; i <= 1000; i++) {
        testData.users.push({
            id: i,
            name: `User ${i}`,
            email: `user${i}@example.com`,
            phone: `+1-555-${String(i).padStart(4, '0')}`,
            address: {
                street: `${i} Main Street`,
                city: `City ${i % 100}`,
                state: `State ${i % 50}`,
                zip: String(10000 + i).substring(0, 5)
            },
            preferences: {
                newsletter: i % 2 === 0,
                notifications: i % 3 === 0,
                theme: i % 2 === 0 ? 'dark' : 'light'
            }
        });
    }

    // Generate test products
    for (let i = 1; i <= 500; i++) {
        testData.products.push({
            id: i,
            name: `Product ${i}`,
            description: `This is a detailed description for product ${i}. It contains multiple sentences to increase the file size for better compression testing. The product has many features and benefits that customers will love.`,
            price: Math.round((Math.random() * 1000 + 10) * 100) / 100,
            category: `Category ${i % 20}`,
            inStock: i % 5 !== 0,
            tags: [`tag-${i}`, `category-${i % 10}`, `type-${i % 5}`],
            specifications: {
                weight: `${Math.random() * 10 + 1} lbs`,
                dimensions: `${Math.random() * 20 + 5} x ${Math.random() * 20 + 5} x ${Math.random() * 20 + 5} inches`,
                color: ['red', 'blue', 'green', 'yellow', 'black', 'white'][i % 6],
                material: ['plastic', 'metal', 'wood', 'fabric', 'glass'][i % 5]
            }
        });
    }

    // Utility functions with repetitive patterns
    const utils = {
        formatCurrency: function(amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        },

        formatDate: function(date) {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(new Date(date));
        },

        validateEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        validatePhone: function(phone) {
            const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
            return phoneRegex.test(phone);
        },

        generateId: function() {
            return Math.random().toString(36).substr(2, 9);
        },

        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    };

    // API simulation functions
    const api = {
        baseUrl: '/api',
        
        get: async function(endpoint) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('API GET error:', error);
                throw error;
            }
        },

        post: async function(endpoint, data) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('API POST error:', error);
                throw error;
            }
        },

        put: async function(endpoint, data) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('API PUT error:', error);
                throw error;
            }
        },

        delete: async function(endpoint) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('API DELETE error:', error);
                throw error;
            }
        }
    };

    // Event handling system
    const eventSystem = {
        events: {},

        on: function(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        },

        off: function(event, callback) {
            if (!this.events[event]) return;
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        },

        emit: function(event, data) {
            if (!this.events[event]) return;
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Event callback error:', error);
                }
            });
        }
    };

    // Data processing functions
    const dataProcessor = {
        sortBy: function(array, key, direction = 'asc') {
            return array.sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                
                if (direction === 'asc') {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                } else {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                }
            });
        },

        filterBy: function(array, filters) {
            return array.filter(item => {
                return Object.keys(filters).every(key => {
                    const filterValue = filters[key];
                    const itemValue = item[key];
                    
                    if (typeof filterValue === 'string') {
                        return itemValue.toLowerCase().includes(filterValue.toLowerCase());
                    }
                    
                    return itemValue === filterValue;
                });
            });
        },

        groupBy: function(array, key) {
            return array.reduce((groups, item) => {
                const group = item[key];
                if (!groups[group]) {
                    groups[group] = [];
                }
                groups[group].push(item);
                return groups;
            }, {});
        },

        paginate: function(array, page, limit) {
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            return {
                data: array.slice(startIndex, endIndex),
                total: array.length,
                page: page,
                totalPages: Math.ceil(array.length / limit),
                hasNext: endIndex < array.length,
                hasPrev: page > 1
            };
        }
    };

    // Performance monitoring
    const performanceMonitor = {
        marks: {},

        start: function(name) {
            this.marks[name] = performance.now();
        },

        end: function(name) {
            if (!this.marks[name]) {
                console.warn(`No start mark found for: ${name}`);
                return null;
            }
            
            const duration = performance.now() - this.marks[name];
            delete this.marks[name];
            
            console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
            return duration;
        },

        measure: function(name, startMark, endMark) {
            if (performance.measure) {
                performance.measure(name, startMark, endMark);
                const measures = performance.getEntriesByName(name);
                if (measures.length > 0) {
                    console.log(`Measure: ${name} took ${measures[0].duration.toFixed(2)}ms`);
                }
            }
        }
    };

    // Initialize the large script
    function init() {
        console.log('Large script loaded for CDN compression testing');
        console.log(`Test data generated: ${testData.users.length} users, ${testData.products.length} products`);
        
        // Simulate some processing
        performanceMonitor.start('dataProcessing');
        
        const sortedUsers = dataProcessor.sortBy(testData.users, 'name');
        const filteredProducts = dataProcessor.filterBy(testData.products, { inStock: true });
        const groupedProducts = dataProcessor.groupBy(testData.products, 'category');
        
        performanceMonitor.end('dataProcessing');
        
        // Emit initialization event
        eventSystem.emit('initialized', {
            users: sortedUsers.length,
            products: filteredProducts.length,
            categories: Object.keys(groupedProducts).length
        });
    }

    // Expose global functions for testing
    window.LargeScriptTest = {
        testData: testData,
        utils: utils,
        api: api,
        eventSystem: eventSystem,
        dataProcessor: dataProcessor,
        performanceMonitor: performanceMonitor,
        init: init
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// This JavaScript file is intentionally large and contains repetitive patterns
// to effectively test CDN minification and compression features
// Total size should be around 30KB+ to see meaningful compression results
