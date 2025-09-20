// CDN Test Website JavaScript

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initPerformanceMonitoring();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

// API Testing Functions
async function testAPI(endpoint) {
    const startTime = performance.now();
    const output = document.getElementById('api-output');
    
    try {
        output.textContent = 'Loading...';
        
        const response = await fetch(endpoint, {
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        const data = await response.json();
        
        // Get response headers
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        
        const result = {
            endpoint: endpoint,
            status: response.status,
            responseTime: responseTime + 'ms',
            headers: headers,
            data: data
        };
        
        output.textContent = JSON.stringify(result, null, 2);
        
        // Log to console for debugging
        console.log('API Test Result:', result);
        
    } catch (error) {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        output.textContent = JSON.stringify({
            endpoint: endpoint,
            error: error.message,
            responseTime: responseTime + 'ms'
        }, null, 2);
    }
}

// Performance Testing Functions
function loadMultipleResources() {
    const container = document.getElementById('small-images-container');
    container.innerHTML = '';
    
    const startTime = performance.now();
    let loadedCount = 0;
    const totalImages = 20;
    
    for (let i = 1; i <= totalImages; i++) {
        const img = document.createElement('img');
        img.src = `/assets/images/small/icon-${i}.jpg`;
        img.alt = `Small image ${i}`;
        img.onerror = function() {
            // If image doesn't exist, use a placeholder
            this.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23${Math.floor(Math.random()*16777215).toString(16)}"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="12">${i}</text></svg>`;
        };
        img.onload = function() {
            loadedCount++;
            if (loadedCount === totalImages) {
                const endTime = performance.now();
                const totalTime = Math.round(endTime - startTime);
                console.log(`Loaded ${totalImages} images in ${totalTime}ms`);
                
                // Show result
                const resultDiv = document.createElement('div');
                resultDiv.style.cssText = 'text-align: center; margin-top: 1rem; padding: 1rem; background: #e8f5e8; border-radius: 5px;';
                resultDiv.textContent = `✅ Loaded ${totalImages} images in ${totalTime}ms (avg: ${Math.round(totalTime/totalImages)}ms per image)`;
                container.appendChild(resultDiv);
            }
        };
        container.appendChild(img);
    }
}

function showPageMetrics() {
    const output = document.getElementById('metrics-output');
    
    if (performance && performance.timing) {
        const timing = performance.timing;
        const metrics = {
            'DNS Lookup': (timing.domainLookupEnd - timing.domainLookupStart) + 'ms',
            'Connection': (timing.connectEnd - timing.connectStart) + 'ms',
            'Request': (timing.responseStart - timing.requestStart) + 'ms',
            'Response': (timing.responseEnd - timing.responseStart) + 'ms',
            'DOM Processing': (timing.domComplete - timing.domLoading) + 'ms',
            'Total Load Time': (timing.loadEventEnd - timing.navigationStart) + 'ms'
        };
        
        let metricsHTML = '<h5>Page Load Metrics:</h5>';
        for (const [key, value] of Object.entries(metrics)) {
            metricsHTML += `<div><strong>${key}:</strong> ${value}</div>`;
        }
        
        // Add paint metrics if available
        if (performance.getEntriesByType) {
            const paintEntries = performance.getEntriesByType('paint');
            if (paintEntries.length > 0) {
                metricsHTML += '<h5 style="margin-top: 1rem;">Paint Metrics:</h5>';
                paintEntries.forEach(entry => {
                    metricsHTML += `<div><strong>${entry.name}:</strong> ${Math.round(entry.startTime)}ms</div>`;
                });
            }
        }
        
        output.innerHTML = metricsHTML;
        
        // Log to console
        console.log('Performance Metrics:', metrics);
        
    } else {
        output.textContent = 'Performance timing not available in this browser';
    }
}

// Performance Monitoring
function initPerformanceMonitoring() {
    // Monitor resource loading
    if (performance && performance.getEntriesByType) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.entryType === 'resource') {
                    console.log(`Resource loaded: ${entry.name} - ${Math.round(entry.duration)}ms`);
                }
            });
        });
        
        observer.observe({entryTypes: ['resource']});
    }
    
    // Log page load time
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (performance && performance.timing) {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                console.log(`Page loaded in ${loadTime}ms`);
                
                // Create a small notification
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                `;
                notification.textContent = `Page loaded in ${loadTime}ms`;
                document.body.appendChild(notification);
                
                // Remove notification after 3 seconds
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            }
        }, 100);
    });
}

// Utility function to test CDN headers
function checkCDNHeaders() {
    fetch(window.location.href, { method: 'HEAD' })
        .then(response => {
            const headers = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
            
            console.log('Response Headers:', headers);
            
            // Check for common CDN headers
            const cdnHeaders = [
                'cf-ray', 'cf-cache-status',  // Cloudflare
                'x-cache', 'x-served-by',     // Various CDNs
                'x-amz-cf-id',                // AWS CloudFront
                'server'                      // Server header
            ];
            
            const detectedHeaders = {};
            cdnHeaders.forEach(header => {
                if (headers[header]) {
                    detectedHeaders[header] = headers[header];
                }
            });
            
            if (Object.keys(detectedHeaders).length > 0) {
                console.log('CDN Headers detected:', detectedHeaders);
            } else {
                console.log('No CDN headers detected - likely direct server connection');
            }
            
            return detectedHeaders;
        })
        .catch(error => {
            console.error('Error checking headers:', error);
        });
}

// Auto-check CDN headers on page load
window.addEventListener('load', () => {
    setTimeout(checkCDNHeaders, 1000);
});

// Expose functions globally for manual testing
window.testAPI = testAPI;
window.loadMultipleResources = loadMultipleResources;
window.showPageMetrics = showPageMetrics;
window.checkCDNHeaders = checkCDNHeaders;
