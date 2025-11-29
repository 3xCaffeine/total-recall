export interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://wttr.in/${lat},${lon}?format=j1`
    );
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const current = data.current_condition[0];
    const area = data.nearest_area[0];

    return {
      temperature: parseInt(current.temp_C),
      feelsLike: parseInt(current.FeelsLikeC),
      condition: current.weatherDesc[0].value,
      humidity: parseInt(current.humidity),
      windSpeed: parseInt(current.windspeedKmph),
      location: area.areaName[0].value,
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return null;
  }
}
