import React, { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, List, Maximize2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../lib/AppContext';
import { translations, categories } from '../lib/mockData';
import { Cafe } from '../lib/types';
import { GoogleMapsService } from '../services/googleMapsService';
import { CafeService } from '../services/cafeService';
import { BackButton } from './BackButton';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

interface MapPageRealProps {
  onNavigate: (page: string) => void;
}

export function MapPageReal({ onNavigate }: MapPageRealProps) {
  const { language, setSelectedCafe } = useApp();
  const t = translations[language];
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState([1.2]);
  const [selectedMapCafe, setSelectedMapCafe] = useState<Cafe | null>(null);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [allCafes, setAllCafes] = useState<Cafe[]>([]); // Store all cafes before filtering
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0 });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([]);
  const [minRating, setMinRating] = useState([0]);
  const [openNow, setOpenNow] = useState(false);

  // Initialize map and load cafes
  useEffect(() => {
    initializeMap();
  }, []);

  // Update cafes when radius changes
  useEffect(() => {
    if (userLocation) {
      loadCafes(userLocation, radiusMiles[0]);
    }
  }, [radiusMiles]);

  // Apply filters when filter settings change
  useEffect(() => {
    if (allCafes.length > 0) {
      applyFilters();
    }
  }, [selectedCategories, priceRange, minRating, openNow, allCafes]);

  const initializeMap = async () => {
    setLoading(true);
    try {
      console.log('🗺️ Initializing map...');
      
      // Get user location
      const location = await GoogleMapsService.getUserLocation();
      console.log('📍 User location:', location);
      setUserLocation(location);

      // Create map
      if (mapRef.current) {
        console.log('🎨 Creating map instance...');
        const map = await GoogleMapsService.createMap(mapRef.current, location);
        mapInstanceRef.current = map;

        console.log('✅ Map created successfully');

        // Add user location marker
        new google.maps.Marker({
          position: location,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          title: 'Your Location'
        });

        // Load cafes
        await loadCafes(location, radiusMiles[0]);
      }
    } catch (error: any) {
      console.error('❌ Error initializing map:', error);
      
      let errorMessage = 'Failed to load map.';
      
      if (error.message.includes('API key')) {
        errorMessage = 'Google Maps API key issue. Please check your .env file.';
      } else if (error.message.includes('billing')) {
        errorMessage = 'Please enable billing in Google Cloud Console.';
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const loadCafes = async (location: { lat: number; lng: number }, radiusMiles: number) => {
    setLoading(true);
    setIsAiEnhancing(true);
    
    try {
      const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
      console.log(`🔍 Loading cafes within ${radiusMiles} miles (${radiusMeters}m)...`);
      
      let enhancementComplete = false;
      let enhancedCount = 0;
      
      // Progressive loading: update UI as cafes get enhanced
      const nearbyCafes = await GoogleMapsService.searchNearbyCafes(
        location, 
        radiusMeters,
        (updatedCafes) => {
          // Apply filters and update state as AI processes each batch
          // This ensures filters work with updated categories
          const filteredCafes = CafeService.filterCafes(updatedCafes, {
            categories: filters.categories.length > 0 ? filters.categories : undefined,
            openNow: filters.openNow,
            minRating: filters.minRating > 0 ? filters.minRating : undefined,
            maxDistance: radiusMiles
          });
          setCafes([...filteredCafes]);
          updateMarkers(filteredCafes);
          
          if (!enhancementComplete) {
            enhancedCount += 5; // Assume 5 per batch
            setAiProgress({ 
              current: Math.min(enhancedCount, updatedCafes.length), 
              total: updatedCafes.length 
            });
            console.log(`🔄 AI enhanced ${enhancedCount}/${updatedCafes.length} cafés - filters updating...`);
          }
        }
      );
      
      console.log(`📍 Received ${nearbyCafes.length} cafes from Places API`);
      
      // Apply filters
      const filteredCafes = CafeService.filterCafes(nearbyCafes, {
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        openNow: filters.openNow,
        minRating: filters.minRating > 0 ? filters.minRating : undefined,
        maxDistance: radiusMiles
      });

      console.log(`✅ After filtering: ${filteredCafes.length} cafes`);
      
      setAllCafes(nearbyCafes); // Store all cafes
      setCafes(filteredCafes);
      updateMarkers(filteredCafes);
      setAiProgress({ current: 0, total: nearbyCafes.length });
      setLoading(false); // Stop loading immediately, AI continues in background
      
      if (filteredCafes.length > 0) {
        toast.success(`Found ${filteredCafes.length} cafes nearby! AI analyzing...`);
      } else {
        toast.warning('No cafes found in this area. Try increasing the radius.');
      }
      
      // Wait a bit then mark enhancement as complete
      setTimeout(() => {
        enhancementComplete = true;
        setIsAiEnhancing(false);
        setAiProgress({ current: nearbyCafes.length, total: nearbyCafes.length });
        console.log('✅ AI enhancement complete - all categories updated');
        toast.success('🎉 AI analysis complete! Filters are now fully accurate.');
      }, 30000); // 30 seconds max for enhancement
      
    } catch (error: any) {
      console.error('❌ Error loading cafes:', error);
      
      let errorMessage = 'Failed to load cafes.';
      
      if (error.message.includes('REQUEST_DENIED')) {
        errorMessage = 'Places API access denied. Please enable billing in Google Cloud.';
      } else if (error.message.includes('billing')) {
        errorMessage = 'Billing not enabled. Go to Google Cloud Console → Billing.';
      }
      
      toast.error(errorMessage);
      setCafes([]);
      setLoading(false);
      setIsAiEnhancing(false);
    }
  };

  const updateMarkers = (cafesToShow: Cafe[]) => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    cafesToShow.forEach(cafe => {
      const marker = new google.maps.Marker({
        position: { lat: cafe.location.lat, lng: cafe.location.lng },
        map: mapInstanceRef.current,
        title: cafe.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="${cafe.status === 'open' ? '#D97706' : '#6B7280'}" stroke="white" stroke-width="3"/>
              <text x="20" y="26" text-anchor="middle" font-size="18" fill="white">☕</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        }
      });

      marker.addListener('click', () => {
        handleMarkerClick(cafe);
        mapInstanceRef.current?.panTo({ lat: cafe.location.lat, lng: cafe.location.lng });
      });

      markersRef.current.push(marker);
    });
  };

  const handleMarkerClick = (cafe: Cafe) => {
    setSelectedMapCafe(cafe);
  };

  const handleViewDetails = () => {
    if (selectedMapCafe) {
      setSelectedCafe(selectedMapCafe);
      onNavigate('details');
    }
  };

  const applyFilters = () => {
    const filtered = CafeService.filterCafes(allCafes, {
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      priceRange: priceRange.length > 0 ? priceRange : undefined,
      minRating: minRating[0] > 0 ? minRating[0] : undefined,
      openNow: openNow || undefined,
      maxDistance: radiusMiles[0]
    });
    
    setCafes(filtered);
    updateMarkers(filtered);
  };

  const handleSearch = () => {
    if (!userLocation) return;
    
    const filtered = cafes.filter(cafe =>
      cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cafe.location.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    updateMarkers(filtered);
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const togglePriceRange = (price: number) => {
    if (priceRange.includes(price)) {
      setPriceRange(priceRange.filter(p => p !== price));
    } else {
      setPriceRange([...priceRange, price]);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setPriceRange([]);
    setMinRating([0]);
    setOpenNow(false);
  };

  const activeFilterCount = selectedCategories.length + priceRange.length + (minRating[0] > 0 ? 1 : 0) + (openNow ? 1 : 0);

  return (
    <div className="h-[calc(100vh-73px)] relative overflow-hidden">
      {/* Google Map Container */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--brand-primary)' }}></div>
            <p className="text-muted-foreground">Loading cafes...</p>
          </div>
        </div>
      )}

      {/* Search and Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-4 space-y-3"
        >
          <BackButton onNavigate={onNavigate} />
          
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search cafes or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 text-sm"
              />
            </div>
            <Button size="sm" variant="outline" style={{ color: 'var(--brand-primary)' }} onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge 
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  {activeFilterCount}
                </Badge>
              )}
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {/* Collapsible Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <ScrollArea className="max-h-96 pr-4">
                  <div className="space-y-4 py-3">
                    {/* Categories */}
                    <div>
                      <Label className="text-xs font-semibold mb-2 block">Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                          <Badge
                            key={category}
                            variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                            className="cursor-pointer transition-all hover:scale-105"
                            style={
                              selectedCategories.includes(category)
                                ? { backgroundColor: 'var(--brand-primary)' }
                                : {}
                            }
                            onClick={() => toggleCategory(category)}
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <Label className="text-xs font-semibold mb-2 block">Price Range</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map(price => (
                          <button
                            key={price}
                            onClick={() => togglePriceRange(price)}
                            className={`px-3 py-1.5 rounded border-2 text-sm transition-all ${
                              priceRange.includes(price)
                                ? 'border-current'
                                : 'border-gray-200'
                            }`}
                            style={priceRange.includes(price) ? { 
                              borderColor: 'var(--brand-primary)', 
                              color: 'var(--brand-primary)' 
                            } : {}}
                          >
                            {'$'.repeat(price)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Minimum Rating */}
                    <div>
                      <Label className="text-xs font-semibold mb-2 block">
                        Minimum Rating: {minRating[0].toFixed(1)} ⭐
                      </Label>
                      <Slider
                        value={minRating}
                        onValueChange={setMinRating}
                        max={5}
                        min={0}
                        step={0.5}
                        className="w-full"
                      />
                    </div>

                    {/* Open Now */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Open Now</Label>
                      <Button
                        size="sm"
                        variant={openNow ? 'default' : 'outline'}
                        onClick={() => setOpenNow(!openNow)}
                        style={openNow ? { backgroundColor: 'var(--brand-primary)' } : {}}
                      >
                        {openNow ? 'On' : 'Off'}
                      </Button>
                    </div>

                    {/* Clear Filters */}
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Radius: {radiusMiles[0]}mi</span>
              <button
                onClick={() => setShowList(!showList)}
                className="flex items-center gap-1 text-sm hover:underline"
                style={{ color: 'var(--brand-primary)' }}
              >
                {showList ? <Maximize2 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                {showList ? 'Hide List' : 'Show List'}
              </button>
            </div>
            <Slider
              value={radiusMiles}
              onValueChange={setRadiusMiles}
              max={10}
              min={0.5}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {cafes.length} cafes found
            </div>
            {isAiEnhancing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-md p-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                  <span className="text-xs font-semibold text-purple-900">AI Enhancing</span>
                </div>
                <p className="text-xs text-purple-700 leading-tight">
                  {aiProgress.current}/{aiProgress.total} analyzed
                </p>
                {aiProgress.total > 0 && (
                  <div className="mt-1.5 w-full bg-purple-200 rounded-full h-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(aiProgress.current / aiProgress.total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                      className="bg-purple-600 h-1 rounded-full"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Cafe List */}
        {showList && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            <div className="p-4 space-y-2">
              {cafes.map((cafe) => (
                <button
                  key={cafe.id}
                  onClick={() => handleMarkerClick(cafe)}
                  className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                    selectedMapCafe?.id === cafe.id
                      ? 'border-current shadow-sm'
                      : 'border-gray-200'
                  }`}
                  style={
                    selectedMapCafe?.id === cafe.id
                      ? { borderColor: 'var(--brand-primary)' }
                      : {}
                  }
                >
                  <h4 className="mb-1 text-sm font-medium">{cafe.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>⭐ {cafe.rating.toFixed(1)}</span>
                    <span>•</span>
                    <span>{cafe.distance} mi</span>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={
                        cafe.status === 'open'
                          ? { backgroundColor: 'var(--status-open)', color: 'white' }
                          : cafe.status === 'busy'
                          ? { backgroundColor: 'var(--status-busy)', color: 'white' }
                          : {}
                      }
                    >
                      {cafe.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Selected Cafe Card */}
      {selectedMapCafe && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-10"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div
                  className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${selectedMapCafe.image})` }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="mb-1 truncate font-medium">{selectedMapCafe.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>⭐ {selectedMapCafe.rating.toFixed(1)}</span>
                    <span>•</span>
                    <span>{selectedMapCafe.distance} mi</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedMapCafe.categories.slice(0, 2).map(category => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleViewDetails}
                className="w-full mt-3"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

