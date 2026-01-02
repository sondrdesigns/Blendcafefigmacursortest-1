import { Cafe, CafeStatus } from '../lib/types';
import { AiCategorizationService } from './aiCategorizationService';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const USE_AI_CATEGORIZATION = true; // Set to false to use basic categorization

export class GoogleMapsService {
  private static googleMaps: typeof google.maps | null = null;
  private static isLoading: boolean = false;
  private static loadPromise: Promise<typeof google.maps> | null = null;

  /**
   * Initialize Google Maps API by loading script
   */
  static async initialize(): Promise<typeof google.maps> {
    // Return cached instance
    if (this.googleMaps) {
      return this.googleMaps;
    }

    // Wait for ongoing load
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Validate API key
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') {
      throw new Error('❌ Google Maps API key not configured. Please check your .env file.');
    }

    console.log('🗺️ Loading Google Maps API...');

    this.isLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        this.googleMaps = window.google.maps;
        this.isLoading = false;
        resolve(window.google.maps);
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Success callback
      (window as any).initGoogleMaps = () => {
        console.log('✅ Google Maps loaded successfully');
        this.googleMaps = window.google.maps;
        this.isLoading = false;
        resolve(window.google.maps);
      };

      // Error handling
      script.onerror = () => {
        this.isLoading = false;
        this.loadPromise = null;
        reject(new Error('❌ Failed to load Google Maps API. Check your API key and billing.'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Create a map instance
   */
  static async createMap(element: HTMLElement, center: { lat: number; lng: number }): Promise<google.maps.Map> {
    const maps = await this.initialize();

    const map = new maps.Map(element, {
      center: center,
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    });

    return map;
  }

  /**
   * Search for cafes near a location using Places API
   */
  static async searchNearbyCafes(
    location: { lat: number; lng: number },
    radiusMeters: number = 2000,
    onProgressUpdate?: (cafes: Cafe[]) => void
  ): Promise<Cafe[]> {
    try {
      console.log('🔍 Searching for cafes near:', location, 'Radius:', radiusMeters + 'm');
      
      const maps = await this.initialize();
      
      // Create a temporary div for PlacesService (required by Google)
      const tempDiv = document.createElement('div');
      const service = new maps.places.PlacesService(tempDiv);

      const request: google.maps.places.PlaceSearchRequest = {
        location: new maps.LatLng(location.lat, location.lng),
        radius: radiusMeters,
        type: 'cafe',
        keyword: 'coffee'
      };

      return new Promise(async (resolve, reject) => {
        const allCafes: Cafe[] = [];
        
        const fetchCafes = (pageToken?: string) => {
          const paginatedRequest = pageToken 
            ? { ...request, pageToken }
            : request;
            
          service.nearbySearch(paginatedRequest, async (results, status, pagination) => {
            console.log('📍 Places API Status:', status);
            
            if (status === maps.places.PlacesServiceStatus.OK && results) {
              console.log(`✅ Found ${results.length} cafes in this batch (Total so far: ${allCafes.length + results.length})`);
              
              // Convert places to cafes
              const cafes = results.map((place) => this.convertPlaceToCafe(place, location));
              allCafes.push(...cafes);
              
              // Call progress update to show cafes incrementally
              if (onProgressUpdate) {
                onProgressUpdate([...allCafes]);
              }
              
              // Check if there are more results
              if (pagination && pagination.hasNextPage) {
                console.log('📄 More results available, fetching next page...');
                // Wait 2 seconds before next request (Google API requirement)
                setTimeout(() => {
                  pagination.nextPage();
                }, 2000);
              } else {
                // No more pages, return all cafes
                console.log(`✅ Total cafes found: ${allCafes.length}`);
                console.log('⚡ Returning all cafes immediately (AI will enhance in background)');
                
                // Use AI to categorize if enabled (but don't wait for it)
                if (USE_AI_CATEGORIZATION) {
                  console.log('🤖 Starting AI enhancement in background...');
                  this.enhanceCafesWithAI(allCafes, onProgressUpdate).then(() => {
                    console.log('✅ Background AI enhancement complete!');
                  }).catch(error => {
                    console.error('⚠️ Background AI enhancement failed:', error);
                  });
                }
                
                resolve(allCafes);
              }
            } else if (status === maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              console.warn('⚠️ No cafes found in this area');
              resolve(allCafes.length > 0 ? allCafes : []);
            } else {
              const errorMessage = this.getPlacesErrorMessage(status);
              console.error('❌ Places API error:', status, errorMessage);
              reject(new Error(errorMessage));
            }
          });
        };
        
        // Start fetching
        fetchCafes();
      });
    } catch (error) {
      console.error('❌ Error searching cafes:', error);
      throw error;
    }
  }

  /**
   * Enhance cafes with AI-powered categorization, summaries, and review analysis
   */
  private static async enhanceCafesWithAI(
    cafes: Cafe[],
    onProgressUpdate?: (cafes: Cafe[]) => void
  ): Promise<void> {
    try {
      const maps = await this.initialize();
      const tempDiv = document.createElement('div');
      const service = new maps.places.PlacesService(tempDiv);

      // Process cafes in batches to avoid rate limits
      const batchSize = 5; // Increased from 3 to 5 for faster processing
      console.log(`🤖 Starting AI enhancement for ${cafes.length} cafés...`);
      
      for (let i = 0; i < cafes.length; i += batchSize) {
        const batch = cafes.slice(i, i + batchSize);
        
        console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(cafes.length/batchSize)} (${batch.length} cafés)`);

        await Promise.all(
          batch.map(async (cafe) => {
            try {
              // Get full place details including ALL available review data and hours
              const placeDetails = await new Promise<google.maps.places.PlaceResult | null>(
                (resolve) => {
                  service.getDetails(
                    {
                      placeId: cafe.id,
                      fields: ['reviews', 'user_ratings_total', 'editorial_summary', 'opening_hours', 'utc_offset_minutes']
                    },
                    (place, status) => {
                      if (status === maps.places.PlacesServiceStatus.OK && place) {
                        resolve(place);
                      } else {
                        resolve(null);
                      }
                    }
                  );
                }
              );

              if (placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0) {
                // Extract ALL review data with ratings and full text
                const reviews = placeDetails.reviews;
                
                // Create rich review texts with context
                const reviewTexts = reviews.map((review, idx) => {
                  const rating = review.rating || 0;
                  const text = review.text || '';
                  const author = review.author_name || 'Anonymous';
                  // Include rating context to help AI understand sentiment depth
                  return `[${rating}/5 stars] ${text}`;
                });

                // Update hours information with detailed data
                if (placeDetails.opening_hours) {
                  const hours = placeDetails.opening_hours.weekday_text?.map((text) => {
                    const [day, time] = text.split(': ');
                    const [open, close] = time?.split(' – ') || ['Closed', 'Closed'];
                    return { day, open, close };
                  }) || cafe.hours;
                  
                  cafe.hours = hours;
                  
                  // Update status based on current open/closed state
                  if (placeDetails.opening_hours.isOpen !== undefined) {
                    cafe.status = placeDetails.opening_hours.isOpen() ? 'open' : 'closed';
                  }
                }

                console.log(`📝 Found ${reviews.length} reviews for ${cafe.name}`);
                console.log(`⏰ Hours updated: ${cafe.hours.length > 0 ? 'Yes' : 'No'}`);
                console.log(`📊 Total reviews on Google: ${placeDetails.user_ratings_total || 'unknown'}`);
                console.log(`📏 Review text lengths:`, reviewTexts.map(r => r.length));
                
                // Log first review snippet for debugging
                if (reviewTexts.length > 0) {
                  console.log(`📖 Sample review: "${reviewTexts[0].substring(0, 100)}..."`);
                }

                // 1. Generate AI categories based on reviews
                const aiCategories = await AiCategorizationService.categorizeCafe(
                  cafe.name,
                  reviewTexts,
                  cafe.rating,
                  cafe.priceRange
                );
                cafe.categories = aiCategories;

                // 2. Generate AI summary for the café (including hours)
                const aiSummary = await AiCategorizationService.generateCafeSummary(
                  cafe.name,
                  reviewTexts,
                  cafe.rating,
                  cafe.priceRange,
                  cafe.hours
                );
                cafe.aiSummary = aiSummary;
                cafe.description = aiSummary; // Also update description

                // 3. Analyze and categorize reviews by topic
                const categorizedReviews = await AiCategorizationService.categorizeFeedback(
                  cafe.name,
                  reviewTexts,
                  aiCategories
                );
                cafe.categorizedReviews = categorizedReviews;

                console.log(`✅ AI enhanced "${cafe.name}"`);
                
                // Notify UI of progress update
                if (onProgressUpdate) {
                  onProgressUpdate([...cafes]);
                }
              } else {
                // Fallback: use description if no reviews available
                const mockReviews = [cafe.description];
                const aiCategories = await AiCategorizationService.categorizeCafe(
                  cafe.name,
                  mockReviews,
                  cafe.rating,
                  cafe.priceRange
                );
                cafe.categories = aiCategories;
                console.log(`⚠️ No reviews for ${cafe.name}, used fallback categorization`);
              }
            } catch (error) {
              console.error(`⚠️ Failed to AI enhance "${cafe.name}":`, error);
              // Keep original data if AI fails
            }
          })
        );

        // Shorter delay between batches for faster processing
        if (i + batchSize < cafes.length) {
          await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 500ms to 200ms
        }
        
        // Update UI after each batch
        if (onProgressUpdate) {
          onProgressUpdate([...cafes]);
        }
      }
    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      // Continue with original data
    }
  }

  /**
   * Get user-friendly error message for Places API status
   */
  private static getPlacesErrorMessage(status: string): string {
    switch (status) {
      case 'REQUEST_DENIED':
        return '❌ Places API request denied. Please check:\n1. Places API is enabled in Google Cloud\n2. Billing is enabled\n3. API key is correct';
      case 'OVER_QUERY_LIMIT':
        return '❌ API quota exceeded. Please check your Google Cloud billing.';
      case 'INVALID_REQUEST':
        return '❌ Invalid request to Places API. Please try again.';
      case 'UNKNOWN_ERROR':
        return '❌ Unknown error. Please try again later.';
      default:
        return `❌ Places API error: ${status}`;
    }
  }

  /**
   * Get detailed information about a specific place
   */
  static async getPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult | null> {
    try {
      const maps = await this.initialize();
      
      const tempDiv = document.createElement('div');
      const service = new maps.places.PlacesService(tempDiv);

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId,
        fields: [
          'name',
          'rating',
          'user_ratings_total',
          'formatted_address',
          'geometry',
          'opening_hours',
          'photos',
          'price_level',
          'types',
          'business_status',
          'website',
          'formatted_phone_number'
        ]
      };

      return new Promise((resolve, reject) => {
        service.getDetails(request, (place, status) => {
          if (status === maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            console.error('Place details error:', status);
            reject(new Error(`Place details error: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }

  /**
   * Convert Google Place to Cafe type
   */
  private static convertPlaceToCafe(
    place: google.maps.places.PlaceResult,
    userLocation: { lat: number; lng: number }
  ): Cafe {
    const lat = place.geometry?.location?.lat() || 0;
    const lng = place.geometry?.location?.lng() || 0;

    // Calculate distance
    const distance = this.calculateDistance(
      userLocation.lat,
      userLocation.lng,
      lat,
      lng
    );

    // Determine status
    let status: CafeStatus = 'closed';
    if (place.opening_hours?.isOpen?.()) {
      status = 'open';
    } else if (place.business_status === 'OPERATIONAL') {
      status = 'open';
    }

    // Get photo URL
    const photoUrl = place.photos && place.photos.length > 0
      ? place.photos[0].getUrl({ maxWidth: 600 })
      : 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600';

    // Extract categories from types
    const categories = this.extractCategories(place.types || []);

    // Parse opening hours
    const hours = place.opening_hours?.weekday_text?.map((text) => {
      const [day, time] = text.split(': ');
      const [open, close] = time?.split(' – ') || ['Closed', 'Closed'];
      return { day, open, close };
    }) || [];

    return {
      id: place.place_id || Math.random().toString(36),
      name: place.name || 'Unknown Cafe',
      image: photoUrl,
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      distance: distance,
      status: status,
      categories: categories,
      priceRange: place.price_level || 2,
      location: {
        lat: lat,
        lng: lng,
        address: place.vicinity || place.formatted_address || 'Address not available'
      },
      hours: hours,
      photos: place.photos?.slice(0, 3).map(photo => photo.getUrl({ maxWidth: 600 })) || [photoUrl],
      popularTimes: [],
      amenities: categories,
      description: `${place.name} is a cafe located at ${place.vicinity || 'this location'}.`,
      aiAnalysis: undefined
    };
  }

  /**
   * Extract relevant categories from Google Place types
   */
  private static extractCategories(types: string[]): string[] {
    const categoryMap: { [key: string]: string } = {
      'cafe': 'Coffee',
      'coffee': 'Coffee',
      'restaurant': 'Food',
      'food': 'Food',
      'bar': 'Bar',
      'bakery': 'Pastries',
      'meal_takeaway': 'Takeout'
    };

    const categories: string[] = [];
    types.forEach(type => {
      if (categoryMap[type]) {
        categories.push(categoryMap[type]);
      }
    });

    // Add default if empty
    if (categories.length === 0) {
      categories.push('Coffee');
    }

    return categories;
  }

  /**
   * Calculate distance between two points in miles
   */
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get user's current location
   */
  static async getUserLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Return default location (New York) if error
          resolve({
            lat: parseFloat(import.meta.env.VITE_DEFAULT_LAT || '40.7589'),
            lng: parseFloat(import.meta.env.VITE_DEFAULT_LNG || '-73.9851')
          });
        }
      );
    });
  }
}

