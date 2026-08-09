export interface WeatherData {
  condition: 'rain' | 'clear' | 'cloudy' | 'drizzle' | 'thunderstorm' | 'fog';
  probability: number;
  note: string;
  temperature: number;
}

export async function fetchWeatherForecast(dateStr: string, timeStr: string, lat: number = 10.823, lon: number = 106.6296): Promise<WeatherData | null> {
  const matchDate = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  
  // Reset time for diff to calculate days properly
  now.setHours(0, 0, 0, 0);
  const mDate = new Date(matchDate);
  mDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((mDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
  
  // Open-Meteo free tier provides 16 days forecast
  if (diffDays < 0 || diffDays > 14) {
    return null; 
  }

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weather_code&timezone=Asia%2FBangkok`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Format to match Open-Meteo's hourly time format (YYYY-MM-DDTHH:00)
    // Extract HH from timeStr (e.g. "19:30" -> "19")
    const hour = timeStr.split(':')[0];
    const localTargetStr = `${dateStr}T${hour.padStart(2, '0')}:00`;
    
    const index = data.hourly.time.findIndex((t: string) => t === localTargetStr);
    
    if (index === -1) return null;

    const weatherCode = data.hourly.weather_code[index];
    const precipProb = data.hourly.precipitation_probability[index];
    const temp = data.hourly.temperature_2m[index];

    let condition: WeatherData['condition'] = 'clear';
    let note = '';

    if (weatherCode === 0) {
      condition = 'clear';
      note = 'weather.clear';
    } else if (weatherCode >= 1 && weatherCode <= 3) {
      condition = 'cloudy';
      note = 'weather.cloudy';
    } else if (weatherCode === 45 || weatherCode === 48) {
      condition = 'fog';
      note = 'weather.fog';
    } else if (weatherCode >= 51 && weatherCode <= 55) {
      condition = 'drizzle';
      note = 'weather.drizzle';
    } else if (weatherCode >= 61 && weatherCode <= 67) {
      condition = 'rain';
      note = 'weather.rain';
    } else if (weatherCode >= 80 && weatherCode <= 82) {
      condition = 'rain';
      note = 'weather.heavy_rain';
    } else if (weatherCode >= 95) {
      condition = 'thunderstorm';
      note = 'weather.thunderstorm';
    } else {
      condition = 'clear';
      note = 'weather.normal';
    }

    return {
      condition,
      probability: precipProb,
      note,
      temperature: Math.round(temp)
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return null;
  }
}
