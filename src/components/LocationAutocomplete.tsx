import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from './ui/input';
import { GoogleMapsService } from '../services/googleMapsService';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Search any location...",
  className = ""
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize autocomplete service
  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        await GoogleMapsService.initialize();
        if (window.google && window.google.maps) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
      } catch (error) {
        console.error('Failed to initialize autocomplete:', error);
      }
    };
    initAutocomplete();
  }, []);

  // Fetch predictions as user types
  useEffect(() => {
    if (!inputValue.trim() || !autocompleteServiceRef.current) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoading(true);
    const fetchPredictions = async () => {
      try {
        autocompleteServiceRef.current!.getPlacePredictions(
          {
            input: inputValue,
            types: ['(regions)'], // Cities, states, countries, neighborhoods
          },
          (results, status) => {
            setIsLoading(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results.slice(0, 5) as PlacePrediction[]);
              setShowPredictions(true);
            } else {
              setPredictions([]);
            }
          }
        );
      } catch (error) {
        console.error('Autocomplete error:', error);
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPredictions, 200);
    return () => clearTimeout(debounceTimer);
  }, [inputValue]);

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectPrediction = (prediction: PlacePrediction) => {
    const locationName = prediction.description;
    setInputValue(locationName);
    onChange(locationName);
    setShowPredictions(false);
    setPredictions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Don't call onChange until user selects a prediction
  };

  const clearInput = () => {
    setInputValue('');
    onChange('');
    setPredictions([]);
    setShowPredictions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowPredictions(true)}
          className="pl-10 pr-10"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        ) : inputValue ? (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Predictions Dropdown */}
      <AnimatePresence>
        {showPredictions && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
          >
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => selectPrediction(prediction)}
                className="w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

