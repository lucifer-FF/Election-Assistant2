// Google Maps API Integration for Polling Booth Locator
// This module handles Google Maps functionality for finding and displaying polling stations

class GoogleMapsIntegration {
    constructor() {
        this.map = null;
        this.markers = [];
        this.infoWindow = null;
        this.geocoder = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.userLocation = null;
        this.apiKey = 'your-google-maps-api-key-here'; // Replace with your actual API key
        this.isLoaded = false;
    }

    // Initialize Google Maps
    async init() {
        try {
            // Load Google Maps API script
            await this.loadGoogleMapsScript();
            
            // Initialize map services
            this.geocoder = new google.maps.Geocoder();
            this.directionsService = new google.maps.DirectionsService();
            this.directionsRenderer = new google.maps.DirectionsRenderer();
            this.infoWindow = new google.maps.InfoWindow();
            
            this.isLoaded = true;
            console.log('Google Maps initialized successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Google Maps:', error);
            return { success: false, error: error.message };
        }
    }

    // Load Google Maps API script dynamically
    loadGoogleMapsScript() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.async = true;
            script.defer = true;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places&callback=initGoogleMaps`;
            
            window.initGoogleMaps = () => {
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Failed to load Google Maps API'));
            };

            document.head.appendChild(script);
        });
    }

    // Initialize map with default center (Kolkata, West Bengal)
    initializeMap(mapContainerId, center = { lat: 22.5726, lng: 88.3639 }) {
        if (!this.isLoaded) {
            console.error('Google Maps not loaded yet');
            return;
        }

        const mapOptions = {
            zoom: 12,
            center: center,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ],
            gestureHandling: 'cooperative',
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: true,
            rotateControl: true,
            fullscreenControl: true
        };

        this.map = new google.maps.Map(document.getElementById(mapContainerId), mapOptions);
        this.directionsRenderer.setMap(this.map);

        // Add custom controls
        this.addMapControls();

        // Get user's current location
        this.getUserLocation();
    }

    // Add custom controls to the map
    addMapControls() {
        const locationButton = document.createElement("button");
        locationButton.textContent = "📍 My Location";
        locationButton.classList.add("custom-map-control-button");
        locationButton.style.backgroundColor = "#fff";
        locationButton.style.border = "none";
        locationButton.style.outline = "none";
        locationButton.style.width = "40px";
        locationButton.style.height = "40px";
        locationButton.style.borderRadius = "2px";
        locationButton.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
        locationButton.style.cursor = "pointer";
        locationButton.style.marginRight = "10px";
        locationButton.style.padding = "0px";
        locationButton.title = "Your Location";

        this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(locationButton);

        locationButton.addEventListener("click", () => {
            this.getUserLocation();
        });
    }

    // Get user's current location
    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    this.userLocation = pos;
                    
                    // Add marker for user's location
                    this.addUserLocationMarker(pos);
                    
                    // Center map on user's location
                    this.map.setCenter(pos);
                    this.map.setZoom(14);
                },
                () => {
                    this.showLocationError(true);
                }
            );
        } else {
            this.showLocationError(false);
        }
    }

    // Add marker for user's location
    addUserLocationMarker(position) {
        const marker = new google.maps.Marker({
            position: position,
            map: this.map,
            title: "Your Location",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2
            },
            animation: google.maps.Animation.DROP
        });

        const infoContent = `
            <div style="padding: 10px;">
                <h4 style="margin: 0 0 5px 0; color: #333;">Your Location</h4>
                <p style="margin: 0; font-size: 12px; color: #666;">
                    Lat: ${position.lat.toFixed(6)}<br>
                    Lng: ${position.lng.toFixed(6)}
                </p>
            </div>
        `;

        marker.addListener('click', () => {
            this.infoWindow.setContent(infoContent);
            this.infoWindow.open(this.map, marker);
        });
    }

    // Add polling station markers to the map
    addPollingStationMarkers(pollingStations) {
        // Clear existing markers
        this.clearMarkers();

        pollingStations.forEach(station => {
            const position = {
                lat: station.location.latitude,
                lng: station.location.longitude
            };

            const marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: station.name,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="14" fill="#4CAF50" stroke="#fff" stroke-width="2"/>
                            <text x="16" y="20" text-anchor="middle" fill="white" font-size="14" font-weight="bold">🏛️</text>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(32, 32)
                },
                animation: google.maps.Animation.DROP
            });

            // Create info window content
            const infoContent = this.createPollingStationInfoWindow(station);

            marker.addListener('click', () => {
                this.infoWindow.setContent(infoContent);
                this.infoWindow.open(this.map, marker);
            });

            this.markers.push(marker);
        });

        // Adjust map bounds to show all markers
        this.adjustMapBounds();
    }

    // Create info window content for polling station
    createPollingStationInfoWindow(station) {
        const facilities = station.facilities;
        const facilityIcons = {
            wheelchairAccessible: facilities.wheelchairAccessible ? '♿' : '❌',
            parkingAvailable: facilities.parkingAvailable ? '🅿️' : '❌',
            drinkingWater: facilities.drinkingWater ? '💧' : '❌',
            toilets: facilities.toilets ? '🚻' : '❌',
            waitingArea: facilities.waitingArea ? '🪑' : '❌'
        };

        return `
            <div style="padding: 15px; max-width: 300px;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${station.name}</h3>
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${station.address}</p>
                
                <div style="margin-bottom: 10px;">
                    <strong style="color: #333;">Constituency:</strong> ${station.constituency} (${station.constituencyNumber})<br>
                    <strong style="color: #333;">Part Number:</strong> ${station.partNumber}<br>
                    <strong style="color: #333;">Expected Voters:</strong> ${station.expectedVoters}
                </div>
                
                <div style="margin-bottom: 10px;">
                    <strong style="color: #333;">Facilities:</strong><br>
                    <span style="font-size: 16px;">
                        ${facilityIcons.wheelchairAccessible} Wheelchair Accessible<br>
                        ${facilityIcons.parkingAvailable} Parking Available<br>
                        ${facilityIcons.drinkingWater} Drinking Water<br>
                        ${facilityIcons.toilets} Toilets<br>
                        ${facilityIcons.waitingArea} Waiting Area
                    </span>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <strong style="color: #333;">Contact:</strong><br>
                    ${station.contact.presidingOfficer}<br>
                    📞 ${station.contact.phone}
                </div>
                
                <div style="text-align: center; margin-top: 15px;">
                    <button onclick="googleMaps.getDirections(${station.location.latitude}, ${station.location.longitude})" 
                            style="background: #4285F4; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        🗺️ Directions
                    </button>
                    <button onclick="googleMaps.showStreetView(${station.location.latitude}, ${station.location.longitude})" 
                            style="background: #EA4335; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        🏞️ Street View
                    </button>
                </div>
            </div>
        `;
    }

    // Get directions to a polling station
    getDirections(destLat, destLng) {
        if (!this.userLocation) {
            alert('Please allow location access to get directions');
            return;
        }

        const destination = { lat: destLat, lng: destLng };
        
        const request = {
            origin: this.userLocation,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING
        };

        this.directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                this.directionsRenderer.setDirections(result);
            } else {
                alert('Could not calculate directions: ' + status);
            }
        });
    }

    // Show street view of a location
    showStreetView(lat, lng) {
        const streetViewUrl = `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lng}`;
        window.open(streetViewUrl, '_blank');
    }

    // Search for polling stations by address
    async searchPollingStations(address) {
        try {
            const results = await this.geocodeAddress(address);
            if (results.length > 0) {
                const location = results[0].geometry.location;
                this.map.setCenter(location);
                this.map.setZoom(14);
                
                // Find nearby polling stations (this would query your database)
                await this.findNearbyPollingStations(location.lat(), location.lng());
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Search failed: ' + error.message);
        }
    }

    // Geocode address to coordinates
    geocodeAddress(address) {
        return new Promise((resolve, reject) => {
            this.geocoder.geocode({ address: address }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK) {
                    resolve(results);
                } else {
                    reject(new Error('Geocoding failed: ' + status));
                }
            });
        });
    }

    // Find nearby polling stations (this would integrate with your Firestore database)
    async findNearbyPollingStations(lat, lng, radius = 5000) {
        // This is a placeholder - you would query your Firestore database
        // for polling stations within the specified radius
        
        // Example query structure:
        // const pollingStations = await this.queryNearbyPollingStations(lat, lng, radius);
        
        // For now, return sample data
        const sampleStations = [
            {
                id: 'ps_001',
                name: 'Bhabanipur Government School',
                address: '123, Rashbehari Avenue, Kolkata - 700029',
                constituency: 'Bhabanipur',
                constituencyNumber: '159',
                partNumber: '12',
                location: { latitude: lat + 0.01, longitude: lng + 0.01 },
                facilities: {
                    wheelchairAccessible: true,
                    parkingAvailable: true,
                    drinkingWater: true,
                    toilets: true,
                    waitingArea: true
                },
                contact: {
                    presidingOfficer: 'Mr. S. K. Singh',
                    phone: '+91-9876543210'
                },
                capacity: 1500,
                expectedVoters: 1200
            }
        ];

        this.addPollingStationMarkers(sampleStations);
        return sampleStations;
    }

    // Clear all markers from the map
    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    // Adjust map bounds to show all markers
    adjustMapBounds() {
        if (this.markers.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });

        // Include user location if available
        if (this.userLocation) {
            bounds.extend(this.userLocation);
        }

        this.map.fitBounds(bounds);
        
        // Don't zoom in too far
        const listener = google.maps.event.addListener(this.map, 'idle', () => {
            if (this.map.getZoom() > 16) {
                this.map.setZoom(16);
            }
            google.maps.event.removeListener(listener);
        });
    }

    // Show location error
    showLocationError(browserHasGeolocation) {
        const errorMessage = browserHasGeolocation
            ? 'Error: The Geolocation service failed.'
            : 'Error: Your browser doesn\'t support geolocation.';
        
        console.error(errorMessage);
        alert(errorMessage);
    }

    // Calculate distance between two points (in kilometers)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }
}

// Create global instance
const googleMaps = new GoogleMapsIntegration();

// Export for use in other modules
export default googleMaps;
