// Map Quiz Core - Map initialization and basic functionality
// This handles the Leaflet map setup and country boundary loading

class MapQuizCore {
    constructor() {
        this.map = null;
        this.countriesLayer = null;
        this.enhancedHitboxes = [];
        this.smallCountryMarkers = [];
        this.isMapReady = false;
        
        // Map configuration
        this.mapConfig = {
            center: [20, 0],
            zoom: 2,
            minZoom: 1,
            maxZoom: 8,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true,
            touchZoom: true
        };
        
        // GeoJSON data URLs (fallback options)
        this.geoDataSources = [
            'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
            'https://cdn.jsdelivr.net/npm/world-atlas@3/countries-110m.json' // Alternative source
        ];
        
        this.currentGeoData = null;
    }
    
    // Initialize the map
    async initializeMap() {
        try {
            console.log('Initializing map...');
            
            // Create the Leaflet map
            this.map = L.map('world-map', this.mapConfig);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors | Enhanced for Flag Quiz',
                maxZoom: this.mapConfig.maxZoom,
                minZoom: this.mapConfig.minZoom
            }).addTo(this.map);
            
            // Add zoom event listener to adjust enhanced hitboxes
            this.map.on('zoomend', () => {
                this.adjustEnhancedHitboxes();
            });
            
            // Load country boundaries
            await this.loadCountryBoundaries();
            
            // Apply enhancements for small countries
            this.enhanceSmallCountries();
            
            this.isMapReady = true;
            console.log('Map initialization complete');
            
            return true;
            
        } catch (error) {
            console.error('Map initialization failed:', error);
            await this.createFallbackMap();
            return false;
        }
    }
    
    // Load country boundary data from GeoJSON sources
    async loadCountryBoundaries() {
        let geoData = null;
        
        // Try multiple data sources
        for (const source of this.geoDataSources) {
            try {
                console.log(`Attempting to load from: ${source}`);
                const response = await fetch(source);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                geoData = await response.json();
                console.log(`Successfully loaded country data from: ${source}`);
                break;
                
            } catch (error) {
                console.warn(`Failed to load from ${source}:`, error.message);
                continue;
            }
        }
        
        if (!geoData) {
            throw new Error('Failed to load country boundary data from all sources');
        }
        
        // Store the geo data
        this.currentGeoData = geoData;
        
        // Process and create country layers
        this.createCountryLayers(geoData);
        
        return geoData;
    }
    
    // Create interactive country layers
    createCountryLayers(geoData) {
        console.log('Creating country layers...');
        
        // Style function for countries
        const countryStyle = (feature) => {
            const countryName = this.getCountryName(feature);
            const isSmall = needsEnhancedHitbox(countryName);
            
            return {
                fillColor: isSmall ? '#ff9800' : '#3388ff',
                weight: isSmall ? 2 : 1,
                opacity: 0.8,
                color: isSmall ? '#ff5722' : '#666',
                fillOpacity: isSmall ? 0.4 : 0.3,
                dashArray: isSmall ? '3,3' : null
            };
        };
        
        // Create the GeoJSON layer
        this.countriesLayer = L.geoJSON(geoData, {
            style: countryStyle,
            onEachFeature: (feature, layer) => this.setupCountryInteractions(feature, layer)
        }).addTo(this.map);
        
        console.log(`Created ${Object.keys(this.countriesLayer._layers).length} country layers`);
    }
    
    // Setup interactions for each country
    setupCountryInteractions(feature, layer) {
        const countryName = this.getCountryName(feature);
        layer.countryName = countryName;
        
        // Mouse events
        layer.on({
            mouseover: (e) => this.onCountryMouseOver(e, feature),
            mouseout: (e) => this.onCountryMouseOut(e, feature),
            click: (e) => this.onCountryClick(e, countryName, layer)
        });
        
        // Tooltip
        const isSmall = needsEnhancedHitbox(countryName);
        const tooltipContent = isSmall ? `${countryName} (Enhanced)` : countryName;
        
        layer.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'center',
            className: isSmall ? 'enhanced-tooltip' : 'country-tooltip'
        });
    }
    
    // Mouse over event handler
    onCountryMouseOver(e, feature) {
        if (!this.isAnswered) {
            const isSmall = needsEnhancedHitbox(this.getCountryName(feature));
            e.target.setStyle({
                weight: 3,
                color: isSmall ? '#ff5722' : '#333',
                fillOpacity: 0.6
            });
            e.target.bringToFront();
        }
    }
    
    // Mouse out event handler
    onCountryMouseOut(e, feature) {
        if (!this.isAnswered) {
            this.countriesLayer.resetStyle(e.target);
        }
    }
    
    // Click event handler (to be overridden by game logic)
    onCountryClick(e, countryName, layer) {
        console.log(`Clicked on: ${countryName}`);
        // This will be overridden by the game logic
        if (window.mapQuizGame && typeof window.mapQuizGame.handleCountryClick === 'function') {
            window.mapQuizGame.handleCountryClick(countryName, layer);
        }
    }
    
    // Get standardized country name from feature
    getCountryName(feature) {
        return feature.properties.name || 
               feature.properties.NAME || 
               feature.properties.NAME_EN || 
               feature.properties.admin || 
               feature.properties.NAME_LONG ||
               'Unknown Country';
    }
    
    // Enhance small countries with larger hitboxes
    enhanceSmallCountries() {
        if (!this.countriesLayer) return;
        
        console.log('Adding enhanced hitboxes for small countries...');
        let enhancedCount = 0;
        
        this.countriesLayer.eachLayer((layer) => {
            const countryName = layer.countryName;
            
            if (needsEnhancedHitbox(countryName)) {
                this.addEnhancedHitbox(layer, countryName);
                enhancedCount++;
            }
        });
        
        console.log(`Enhanced ${enhancedCount} small countries`);
    }
    
    // Add enhanced hitbox for a small country
    addEnhancedHitbox(originalLayer, countryName) {
        try {
            // Get the bounds of the original country
            const bounds = originalLayer.getBounds();
            const center = bounds.getCenter();
            
            // Calculate enhanced radius based on zoom level
            const currentZoom = this.map.getZoom();
            const baseRadius = 50000; // 50km base radius
            const zoomFactor = Math.pow(0.7, currentZoom - 2); // Adjust size based on zoom
            const enhancedRadius = Math.max(baseRadius * zoomFactor, 25000); // Minimum 25km
            
            // Create enhanced circular hitbox
            const enhancedHitbox = L.circle(center, {
                radius: enhancedRadius,
                fillColor: 'rgba(255, 152, 0, 0.2)',
                color: '#ff5722',
                weight: 2,
                fillOpacity: 0.15,
                dashArray: '5,5'
            }).addTo(this.map);
            
            // Store reference and setup interactions
            enhancedHitbox.countryName = countryName;
            enhancedHitbox.originalLayer = originalLayer;
            enhancedHitbox.isEnhancedHitbox = true;
            enhancedHitbox.baseRadius = baseRadius;
            
            // Add click handler
            enhancedHitbox.on('click', (e) => {
                if (window.mapQuizGame && typeof window.mapQuizGame.handleCountryClick === 'function') {
                    window.mapQuizGame.handleCountryClick(countryName, enhancedHitbox);
                }
            });
            
            // Add to tracking array
            this.enhancedHitboxes.push(enhancedHitbox);
            
            // Add visual marker for very small countries
            this.addSmallCountryMarker(center, countryName);
            
        } catch (error) {
            console.warn(`Failed to enhance hitbox for ${countryName}:`, error);
        }
    }
    
    // Add visual marker for very small countries
    addSmallCountryMarker(center, countryName) {
        const markerIcon = L.divIcon({
            className: 'small-country-marker',
            html: '📍',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
        });
        
        const marker = L.marker(center, { icon: markerIcon }).addTo(this.map);
        marker.countryName = countryName;
        marker.isSmallCountryMarker = true;
        
        // Add click handler
        marker.on('click', () => {
            if (window.mapQuizGame && typeof window.mapQuizGame.handleCountryClick === 'function') {
                window.mapQuizGame.handleCountryClick(countryName, marker);
            }
        });
        
        // Tooltip
        marker.bindTooltip(`${countryName} (Small Country)`, {
            permanent: false,
            direction: 'top'
        });
        
        this.smallCountryMarkers.push(marker);
    }
    
    // Create fallback map if GeoJSON loading fails
    async createFallbackMap() {
        console.warn('Creating fallback map with basic country rectangles');
        
        // Basic rectangular areas for major countries
        const basicCountries = [
            { name: "United States", bounds: [[25, -125], [49, -66]] },
            { name: "Canada", bounds: [[49, -141], [83, -52]] },
            { name: "Brazil", bounds: [[-33, -74], [5, -35]] },
            { name: "Russia", bounds: [[41, 20], [82, 180]] },
            { name: "China", bounds: [[18, 74], [54, 135]] },
            { name: "Australia", bounds: [[-44, 113], [-10, 154]] },
            { name: "India", bounds: [[6, 68], [37, 97]] },
            { name: "Argentina", bounds: [[-55, -73], [-21, -53]] },
            { name: "France", bounds: [[41, -5], [51, 9]] },
            { name: "Germany", bounds: [[47, 5], [55, 15]] }
        ];
        
        basicCountries.forEach(country => {
            const rect = L.rectangle(country.bounds, {
                color: '#3388ff',
                weight: 2,
                fillOpacity: 0.3
            }).addTo(this.map);
            
            rect.countryName = country.name;
            rect.on('click', () => {
                if (window.mapQuizGame && typeof window.mapQuizGame.handleCountryClick === 'function') {
                    window.mapQuizGame.handleCountryClick(country.name, rect);
                }
            });
            
            rect.bindTooltip(country.name);
        });
        
        this.isMapReady = true;
    }
    
    // Reset map styles to default
    resetMapStyles() {
        if (this.countriesLayer) {
            this.countriesLayer.eachLayer(layer => {
                this.countriesLayer.resetStyle(layer);
            });
        }
        
        // Reset enhanced hitboxes
        this.enhancedHitboxes.forEach(hitbox => {
            hitbox.setStyle({
                fillColor: 'rgba(255, 152, 0, 0.2)',
                color: '#ff5722',
                weight: 2,
                fillOpacity: 0.15,
                dashArray: '5,5'
            });
        });
    }
    
    // Highlight a specific country
    highlightCountry(countryName, isCorrect = true) {
        const style = isCorrect ? {
            fillColor: '#28a745',
            fillOpacity: 0.8,
            weight: 3,
            color: '#155724'
        } : {
            fillColor: '#dc3545',
            fillOpacity: 0.8,
            weight: 3,
            color: '#721c24'
        };
        
        // Highlight in main layer
        if (this.countriesLayer) {
            this.countriesLayer.eachLayer(layer => {
                const layerCountry = normalizeCountryName(layer.countryName || '');
                const targetCountry = normalizeCountryName(countryName);
                
                if (layerCountry === targetCountry) {
                    layer.setStyle(style);
                    layer.bringToFront();
                }
            });
        }
        
        // Highlight enhanced hitboxes
        this.enhancedHitboxes.forEach(hitbox => {
            const hitboxCountry = normalizeCountryName(hitbox.countryName || '');
            const targetCountry = normalizeCountryName(countryName);
            
            if (hitboxCountry === targetCountry) {
                hitbox.setStyle({
                    ...style,
                    fillOpacity: 0.6,
                    dashArray: null
                });
            }
        });
    }
    
    // Get map bounds
    getMapBounds() {
        return this.map ? this.map.getBounds() : null;
    }
    
    // Adjust enhanced hitboxes based on current zoom level
    adjustEnhancedHitboxes() {
        if (!this.map) return;
        
        const currentZoom = this.map.getZoom();
        
        this.enhancedHitboxes.forEach(hitbox => {
            if (hitbox.baseRadius) {
                // Calculate new radius based on zoom
                const zoomFactor = Math.pow(0.7, currentZoom - 2);
                const newRadius = Math.max(hitbox.baseRadius * zoomFactor, 25000);
                
                // Update the circle radius
                hitbox.setRadius(newRadius);
                
                // Adjust opacity based on zoom (more transparent when zoomed in)
                const opacity = Math.max(0.05, 0.15 * zoomFactor);
                hitbox.setStyle({
                    fillOpacity: opacity
                });
            }
        });
    }
    
    // Cleanup method
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.enhancedHitboxes = [];
        this.smallCountryMarkers = [];
        this.countriesLayer = null;
        this.isMapReady = false;
    }
}

// Create global instance
window.mapQuizCore = new MapQuizCore();