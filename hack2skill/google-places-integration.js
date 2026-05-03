// Google Places API Integration for Location Autocomplete
// This module provides location autocomplete and place details functionality

class GooglePlacesIntegration {
    constructor() {
        this.apiKey = 'your-google-maps-api-key-here'; // Replace with your actual API key
        this.autocompleteService = null;
        this.placesService = null;
        this.sessionToken = null;
        this.isLoaded = false;
        this.currentSession = null;
    }

    // Initialize Google Places services
    async init() {
        try {
            // Ensure Google Maps API is loaded
            if (!window.google || !window.google.maps) {
                await this.loadGoogleMapsScript();
            }

            // Initialize Places services
            this.autocompleteService = new google.maps.places.AutocompleteService();
            this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
            
            // Generate new session token
            this.sessionToken = new google.maps.places.AutocompleteSessionToken();
            
            this.isLoaded = true;
            console.log('Google Places API initialized successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Google Places API:', error);
            return { success: false, error: error.message };
        }
    }

    // Load Google Maps API script if not already loaded
    loadGoogleMapsScript() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps && window.google.maps.places) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.async = true;
            script.defer = true;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places&callback=initGooglePlaces`;
            
            window.initGooglePlaces = () => {
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Failed to load Google Maps API with Places library'));
            };

            document.head.appendChild(script);
        });
    }

    // Get place predictions for autocomplete
    async getPlacePredictions(input, options = {}) {
        if (!this.isLoaded) {
            throw new Error('Google Places API not initialized');
        }

        const defaultOptions = {
            types: ['geocode', 'establishment'],
            fields: ['place_id', 'formatted_address', 'geometry', 'name', 'types'],
            componentRestrictions: { country: 'in' }, // Restrict to India
            ...options
        };

        return new Promise((resolve, reject) => {
            this.autocompleteService.getPlacePredictions(
                {
                    input: input,
                    sessionToken: this.sessionToken,
                    ...defaultOptions
                },
                (predictions, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        resolve({
                            success: true,
                            predictions: predictions.map(prediction => ({
                                place_id: prediction.place_id,
                                description: prediction.description,
                                structured_formatting: prediction.structured_formatting,
                                placeTypes: prediction.types,
                                main_text: prediction.structured_formatting?.main_text,
                                secondary_text: prediction.structured_formatting?.secondary_text
                            }))
                        });
                    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        resolve({ success: true, predictions: [] });
                    } else {
                        reject(new Error(`Places API error: ${status}`));
                    }
                }
            );
        });
    }

    // Get detailed information about a place
    async getPlaceDetails(placeId, fields = null) {
        if (!this.isLoaded) {
            throw new Error('Google Places API not initialized');
        }

        const defaultFields = [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
            'address_components',
            'formatted_phone_number',
            'international_phone_number',
            'website',
            'rating',
            'user_ratings_total',
            'photos',
            'opening_hours',
            'types'
        ];

        const requestFields = fields || defaultFields;

        return new Promise((resolve, reject) => {
            this.placesService.getDetails(
                {
                    placeId: placeId,
                    fields: requestFields,
                    sessionToken: this.sessionToken
                },
                (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        resolve({
                            success: true,
                            place: {
                                place_id: place.place_id,
                                name: place.name,
                                formatted_address: place.formatted_address,
                                location: {
                                    lat: place.geometry.location.lat(),
                                    lng: place.geometry.location.lng()
                                },
                                address_components: this.parseAddressComponents(place.address_components),
                                phone_number: place.formatted_phone_number,
                                international_phone_number: place.international_phone_number,
                                website: place.website,
                                rating: place.rating,
                                user_ratings_total: place.user_ratings_total,
                                photos: place.photos?.map(photo => ({
                                    getUrl: ({ maxWidth = 400, maxHeight = 400 } = {}) => 
                                        photo.getUrl({ maxWidth, maxHeight })
                                })) || [],
                                opening_hours: place.opening_hours,
                                types: place.types
                            }
                        });
                        
                        // Generate new session token after successful place details
                        this.sessionToken = new google.maps.places.AutocompleteSessionToken();
                    } else {
                        reject(new Error(`Place Details API error: ${status}`));
                    }
                }
            );
        });
    }

    // Parse address components into structured format
    parseAddressComponents(components) {
        const address = {
            street_number: '',
            route: '',
            locality: '',
            administrative_area_level_1: '',
            administrative_area_level_2: '',
            country: '',
            postal_code: '',
            constituency: '',
            district: '',
            state: ''
        };

        components.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number')) {
                address.street_number = component.long_name;
            } else if (types.includes('route')) {
                address.route = component.long_name;
            } else if (types.includes('locality')) {
                address.locality = component.long_name;
                address.district = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
                address.administrative_area_level_1 = component.long_name;
                address.state = component.long_name;
            } else if (types.includes('administrative_area_level_2')) {
                address.administrative_area_level_2 = component.long_name;
            } else if (types.includes('country')) {
                address.country = component.long_name;
            } else if (types.includes('postal_code')) {
                address.postal_code = component.long_name;
            }
        });

        // Combine street components
        address.street = `${address.street_number} ${address.route}`.trim();
        
        return address;
    }

    // Search for nearby places
    async searchNearbyPlaces(location, radius, type, keyword = '') {
        if (!this.isLoaded) {
            throw new Error('Google Places API not initialized');
        }

        return new Promise((resolve, reject) => {
            const request = {
                location: location,
                radius: radius,
                type: type,
                keyword: keyword
            };

            this.placesService.nearbySearch(request, (results, status, pagination) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve({
                        success: true,
                        places: results.map(place => ({
                            place_id: place.place_id,
                            name: place.name,
                            vicinity: place.vicinity,
                            location: {
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            },
                            rating: place.rating,
                            user_ratings_total: place.user_ratings_total,
                            types: place.types,
                            opening_hours: place.opening_hours,
                            photos: place.photos?.map(photo => ({
                                getUrl: ({ maxWidth = 400, maxHeight = 400 } = {}) => 
                                    photo.getUrl({ maxWidth, maxHeight })
                            })) || []
                        })),
                        pagination: pagination ? {
                            hasNextPage: pagination.hasNextPage,
                            nextPage: () => {
                                pagination.nextPage();
                            }
                        } : null
                    });
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    resolve({ success: true, places: [] });
                } else {
                    reject(new Error(`Nearby Search API error: ${status}`));
                }
            });
        });
    }

    // Search for polling stations nearby
    async findNearbyPollingStations(location, radius = 5000) {
        try {
            // Search for government offices and schools (common polling station locations)
            const governmentPlaces = await this.searchNearbyPlaces(
                location, 
                radius, 
                'establishment', 
                'government office polling station booth'
            );

            const schoolPlaces = await this.searchNearbyPlaces(
                location, 
                radius, 
                'school', 
                'polling station'
            );

            // Combine and deduplicate results
            const allPlaces = [...governmentPlaces.places, ...schoolPlaces.places];
            const uniquePlaces = this.deduplicatePlaces(allPlaces);

            return {
                success: true,
                pollingStations: uniquePlaces.map(place => ({
                    ...place,
                    isPollingStation: this.isLikelyPollingStation(place)
                }))
            };
        } catch (error) {
            console.error('Error finding nearby polling stations:', error);
            return { success: false, error: error.message };
        }
    }

    // Check if a place is likely to be a polling station
    isLikelyPollingStation(place) {
        const pollingKeywords = [
            'polling', 'booth', 'station', 'government', 'office', 
            'school', 'college', 'municipal', 'panchayat', 'ward'
        ];
        
        const name = place.name.toLowerCase();
        const vicinity = place.vicinity.toLowerCase();
        
        return pollingKeywords.some(keyword => 
            name.includes(keyword) || vicinity.includes(keyword)
        );
    }

    // Remove duplicate places based on location proximity
    deduplicatePlaces(places) {
        const uniquePlaces = [];
        const seenLocations = new Set();

        places.forEach(place => {
            const locationKey = `${Math.round(place.location.lat * 1000)}_${Math.round(place.location.lng * 1000)}`;
            
            if (!seenLocations.has(locationKey)) {
                seenLocations.add(locationKey);
                uniquePlaces.push(place);
            }
        });

        return uniquePlaces;
    }

    // Create autocomplete input element
    createAutocompleteInput(inputElement, options = {}) {
        if (!this.isLoaded) {
            console.error('Google Places API not initialized');
            return;
        }

        const defaultOptions = {
            types: ['geocode'],
            componentRestrictions: { country: 'in' },
            fields: ['place_id', 'formatted_address', 'geometry', 'name']
        };

        const autocomplete = new google.maps.places.Autocomplete(inputElement, {
            ...defaultOptions,
            ...options
        });

        // Add event listeners
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            if (place.geometry) {
                const event = new CustomEvent('place-selected', {
                    detail: {
                        place: {
                            place_id: place.place_id,
                            name: place.name,
                            formatted_address: place.formatted_address,
                            location: {
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            },
                            address_components: this.parseAddressComponents(place.address_components)
                        }
                    }
                });
                
                inputElement.dispatchEvent(event);
            }
        });

        return autocomplete;
    }

    // Get text search results
    async textSearch(query, location = null, radius = null) {
        if (!this.isLoaded) {
            throw new Error('Google Places API not initialized');
        }

        return new Promise((resolve, reject) => {
            const request = {
                query: query,
                fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total', 'types']
            };

            if (location) {
                request.location = location;
            }

            if (radius) {
                request.radius = radius;
            }

            this.placesService.textSearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve({
                        success: true,
                        places: results.map(place => ({
                            place_id: place.place_id,
                            name: place.name,
                            formatted_address: place.formatted_address,
                            location: {
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            },
                            rating: place.rating,
                            user_ratings_total: place.user_ratings_total,
                            types: place.types
                        }))
                    });
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    resolve({ success: true, places: [] });
                } else {
                    reject(new Error(`Text Search API error: ${status}`));
                }
            });
        });
    }

    // Reset session token
    resetSessionToken() {
        this.sessionToken = new google.maps.places.AutocompleteSessionToken();
    }

    // Get service status
    getStatus() {
        return {
            isLoaded: this.isLoaded,
            hasAutocompleteService: !!this.autocompleteService,
            hasPlacesService: !!this.placesService,
            hasSessionToken: !!this.sessionToken
        };
    }
}

// Create global instance
const googlePlaces = new GooglePlacesIntegration();

// Export for use in other modules
export default googlePlaces;
