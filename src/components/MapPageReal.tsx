import React, { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, List, Maximize2, ChevronDown, ChevronUp, X, Navigation2, MapPin, Star, Clock, ExternalLink } from 'lucide-react';
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

// Helper to detect device type for maps redirection
const getDirectionsUrl = (address: string, lat: number, lng: number): string => {
  const encodedAddress = encodeURIComponent(address);
  const isAppleDevice = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
  
  if (isAppleDevice) {
    // Apple Maps URL
    return `https://maps.apple.com/?daddr=${encodedAddress}&ll=${lat},${lng}&dirflg=d`;
  } else {
    // Google Maps URL
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&destination_place_id=${lat},${lng}`;
  }
};

interface MapPageRealProps {
  onNavigate: (page: string) => void;
}

export function MapPageReal({ onNavigate }: MapPageRealProps) {
  const { language, setSelectedCafe } = useApp();
  const t = translations[language];
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

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

  // Track if initial load has completed
  const initialLoadRef = useRef(false);
  const loadingRef = useRef(false);

  // Apply filters when filter settings change
  useEffect(() => {
    if (allCafes.length > 0) {
      applyFilters();
    }
  }, [selectedCategories, priceRange, minRating, openNow, allCafes]);

  // Update radius circle when radius changes (without reloading cafes)
  useEffect(() => {
    if (radiusCircleRef.current && userLocation) {
      radiusCircleRef.current.setRadius(radiusMiles[0] * 1609.34);
    }
    
    if (mapInstanceRef.current && userLocation) {
      const zoomLevel = radiusMiles[0] <= 1 ? 15 : radiusMiles[0] <= 3 ? 14 : radiusMiles[0] <= 5 ? 13 : 12;
      mapInstanceRef.current.setZoom(zoomLevel);
    }
  }, [radiusMiles, userLocation]);

  // Initialize map on mount
  useEffect(() => {
    initializeMap();
  }, []);

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

        // Add radius circle to show search area
        radiusCircleRef.current = new google.maps.Circle({
          strokeColor: '#b8834a',
          strokeOpacity: 0.4,
          strokeWeight: 2,
          fillColor: '#b8834a',
          fillOpacity: 0.08,
          map: map,
          center: location,
          radius: radiusMiles[0] * 1609.34, // Convert miles to meters
        });

        // Add user location marker with pulsing effect
        userMarkerRef.current = new google.maps.Marker({
          position: location,
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="#4285F4" stroke="white" stroke-width="3"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          },
          title: 'Your Location',
          zIndex: 1000
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

  const updateMarkers = (cafesToShow: Cafe[]) => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers with improved visuals
    cafesToShow.forEach((cafe, index) => {
      // Color based on status and rating
      const baseColor = cafe.status === 'open' ? '#b8834a' : '#9CA3AF';
      const isHighRated = cafe.rating >= 4.5;
      const markerColor = isHighRated && cafe.status === 'open' ? '#D97706' : baseColor;
      
      // Create attractive marker SVG with unique filter ID
      const filterId = `shadow-${cafe.id}`;
      const markerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
          <defs>
            <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
            </filter>
          </defs>
          <path d="M22 0C10 0 0 10 0 22c0 15 22 30 22 30s22-15 22-30C44 10 34 0 22 0z" fill="${markerColor}" filter="url(#${filterId})"/>
          <circle cx="22" cy="20" r="12" fill="white"/>
          <text x="22" y="25" text-anchor="middle" font-size="14" fill="${markerColor}">☕</text>
          ${isHighRated ? '<circle cx="34" cy="8" r="6" fill="#FBBF24"/><text x="34" y="11" text-anchor="middle" font-size="8" fill="white">★</text>' : ''}
        </svg>
      `;

      const marker = new google.maps.Marker({
        position: { lat: cafe.location.lat, lng: cafe.location.lng },
        map: mapInstanceRef.current,
        title: `${cafe.name} - ${cafe.rating.toFixed(1)}⭐`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
          scaledSize: new google.maps.Size(44, 52),
          anchor: new google.maps.Point(22, 52)
        },
        zIndex: isHighRated ? 100 : 50 - index
      });

      marker.addListener('click', () => {
        setSelectedMapCafe(cafe);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: cafe.location.lat, lng: cafe.location.lng });
          mapInstanceRef.current.setZoom(16);
        }
      });

      markersRef.current.push(marker);
    });
  };

  const loadCafes = async (location: { lat: number; lng: number }, radius: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setIsAiEnhancing(true);
    
    try {
      const radiusMeters = radius * 1609.34; // Convert miles to meters
      console.log(`🔍 Loading cafes within ${radius} miles (${radiusMeters}m)...`);
      
      // Progressive loading: update UI as cafes get enhanced
      const nearbyCafes = await GoogleMapsService.searchNearbyCafes(
        location, 
        radiusMeters,
        (updatedCafes) => {
          // Apply current filters and update state as AI processes each batch
          const currentCategories = selectedCategories;
          const currentOpenNow = openNow;
          const currentMinRating = minRating[0];
          
          const filteredCafes = CafeService.filterCafes(updatedCafes, {
            categories: currentCategories.length > 0 ? currentCategories : undefined,
            openNow: currentOpenNow || undefined,
            minRating: currentMinRating > 0 ? currentMinRating : undefined,
            maxDistance: radius
          });
          setCafes([...filteredCafes]);
          setAllCafes([...updatedCafes]);
          updateMarkers(filteredCafes);
          setAiProgress({ current: updatedCafes.length, total: updatedCafes.length });
        }
      );
      
      console.log(`📍 Received ${nearbyCafes.length} cafes from Places API`);
      
      // Apply current filters
      const filteredCafes = CafeService.filterCafes(nearbyCafes, {
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        openNow: openNow || undefined,
        minRating: minRating[0] > 0 ? minRating[0] : undefined,
        maxDistance: radius
      });

      console.log(`✅ After filtering: ${filteredCafes.length} cafes`);
      
      setAllCafes(nearbyCafes);
      setCafes(filteredCafes);
      updateMarkers(filteredCafes);
      setAiProgress({ current: nearbyCafes.length, total: nearbyCafes.length });
      setLoading(false);
      loadingRef.current = false;
      
      if (nearbyCafes.length > 0) {
        toast.success(`Found ${nearbyCafes.length} cafes nearby!`);
      } else {
        toast.warning('No cafes found in this area. Try increasing the radius.');
      }
      
      // Mark enhancement as complete after a delay
      setTimeout(() => {
        setIsAiEnhancing(false);
      }, 5000);
      
    } catch (error: any) {
      console.error('❌ Error loading cafes:', error);
      
      let errorMessage = 'Failed to load cafes.';
      
      if (error.message?.includes('REQUEST_DENIED')) {
        errorMessage = 'Places API access denied. Please enable billing in Google Cloud.';
      } else if (error.message?.includes('billing')) {
        errorMessage = 'Billing not enabled. Go to Google Cloud Console → Billing.';
      } else if (error.message?.includes('API key')) {
        errorMessage = 'Google Maps API key not configured.';
      }
      
      toast.error(errorMessage);
      setCafes([]);
      setLoading(false);
      loadingRef.current = false;
      setIsAiEnhancing(false);
    }
  };

  const handleCafeSelect = (cafe: Cafe) => {
    setSelectedMapCafe(cafe);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: cafe.location.lat, lng: cafe.location.lng });
      mapInstanceRef.current.setZoom(16);
    }
  };

  const handleViewDetails = () => {
    if (selectedMapCafe) {
      setSelectedCafe(selectedMapCafe);
    }
  };

  const handleGetDirections = (cafe: Cafe) => {
    const url = getDirectionsUrl(cafe.location.address, cafe.location.lat, cafe.location.lng);
    window.open(url, '_blank');
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
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-amber-50/95 via-orange-50/90 to-yellow-50/95 flex items-center justify-center z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              {/* Coffee cup with steam */}
              <div className="relative w-20 h-20 mx-auto mb-4">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-5xl"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  ☕
                </motion.div>
                {/* Steam lines */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-5 rounded-full bg-gradient-to-t from-amber-400/60 to-transparent steam-line"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
              <p className="font-medium" style={{ color: 'var(--brand-primary)' }}>Discovering cafes...</p>
              <p className="text-sm text-muted-foreground mt-1">Finding the best spots near you</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <span>Radius: {radiusMiles[0].toFixed(1)} mi</span>
              <button
                onClick={() => setShowList(!showList)}
                className="flex items-center gap-1 text-sm hover:underline"
                style={{ color: 'var(--brand-primary)' }}
              >
                {showList ? <Maximize2 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                {showList ? 'Hide List' : 'Show List'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={radiusMiles}
                onValueChange={setRadiusMiles}
                max={10}
                min={0.5}
                step={0.1}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => userLocation && loadCafes(userLocation, radiusMiles[0])}
                disabled={loading || !userLocation}
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                <Search className="w-3 h-3" />
              </Button>
            </div>
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
        <AnimatePresence>
          {showList && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <ScrollArea className="max-h-80">
                <div className="p-3 space-y-2">
                  {cafes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No cafes found in this area</p>
                      <p className="text-xs mt-1">Try increasing the radius</p>
                    </div>
                  ) : (
                    cafes.map((cafe, index) => (
                      <motion.div
                        key={cafe.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          selectedMapCafe?.id === cafe.id
                            ? 'border-2 shadow-md'
                            : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                        }`}
                        style={
                          selectedMapCafe?.id === cafe.id
                            ? { borderColor: 'var(--brand-primary)' }
                            : {}
                        }
                      >
                        <button
                          onClick={() => handleCafeSelect(cafe)}
                          className="w-full text-left p-3"
                        >
                          <div className="flex items-start gap-3">
                            {/* Thumbnail */}
                            <div 
                              className="w-14 h-14 rounded-lg bg-cover bg-center flex-shrink-0"
                              style={{ backgroundImage: `url(${cafe.image})` }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm truncate">{cafe.name}</h4>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0.5 flex-shrink-0"
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
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {cafe.rating.toFixed(1)}
                                </span>
                                <span>•</span>
                                <span>{cafe.distance} mi</span>
                                <span>•</span>
                                <span>{'$'.repeat(cafe.priceRange)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                        {/* Quick action buttons */}
                        <div className="flex border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetDirections(cafe);
                            }}
                            className="flex-1 py-2 text-xs font-medium text-muted-foreground hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                          >
                            <Navigation2 className="w-3 h-3" />
                            Directions
                          </button>
                          <div className="w-px bg-gray-100" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCafe(cafe);
                            }}
                            className="flex-1 py-2 text-xs font-medium hover:bg-gray-50 transition-colors"
                            style={{ color: 'var(--brand-primary)' }}
                          >
                            Details
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Cafe Card */}
      <AnimatePresence>
        {selectedMapCafe && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-10"
          >
            <Card className="shadow-xl border-0 overflow-hidden">
              {/* Close button */}
              <button 
                onClick={() => setSelectedMapCafe(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              
              {/* Cafe image header */}
              <div
                className="h-32 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${selectedMapCafe.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <Badge
                    className="mb-2"
                    style={
                      selectedMapCafe.status === 'open'
                        ? { backgroundColor: 'var(--status-open)', color: 'white' }
                        : selectedMapCafe.status === 'busy'
                        ? { backgroundColor: 'var(--status-busy)', color: 'white' }
                        : { backgroundColor: '#6B7280', color: 'white' }
                    }
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {selectedMapCafe.status === 'open' ? 'Open Now' : selectedMapCafe.status === 'busy' ? 'Busy' : 'Closed'}
                  </Badge>
                  <h4 className="text-white font-semibold text-lg truncate drop-shadow-lg">{selectedMapCafe.name}</h4>
                </div>
              </div>
              
              <CardContent className="p-4">
                {/* Rating and distance */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{selectedMapCafe.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">({selectedMapCafe.reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{selectedMapCafe.distance} mi away</span>
                  </div>
                  <div className="text-muted-foreground">
                    {'$'.repeat(selectedMapCafe.priceRange)}
                  </div>
                </div>
                
                {/* Address */}
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {selectedMapCafe.location.address}
                </p>
                
                {/* Categories */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  {selectedMapCafe.categories.slice(0, 3).map(category => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleGetDirections(selectedMapCafe)}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Navigation2 className="w-4 h-4" />
                    Directions
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </Button>
                  <Button
                    onClick={handleViewDetails}
                    className="flex-1"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

