"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWeather, type WeatherData } from "./weather-service";

interface UseWeatherOptions {
  refreshInterval?: number; // in milliseconds
}

export function useWeather({ refreshInterval = 30 * 60 * 1000 }: UseWeatherOptions = {}) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false,
        });
      });

      const { latitude, longitude } = position.coords;
      const data = await fetchWeather(latitude, longitude);
      
      if (data) {
        setWeather(data);
      }
    } catch (err) {
      setError("Unable to fetch weather");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentWeather();

    // Refresh weather periodically
    const interval = setInterval(fetchCurrentWeather, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchCurrentWeather, refreshInterval]);

  return {
    weather,
    isLoading,
    error,
    refresh: fetchCurrentWeather,
  };
}
