/**
 * .weather — live meteorological conditions via the OpenWeather API.
 */
import axios from 'axios';
import { brandEmbed } from '../../core/embeds.js';
import { config } from '../../core/config.js';

const CONDITION_EMOJI = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
  Haze: '🌫️',
};

export default {
  name: 'weather',
  category: 'Utilities',
  description: 'Shows current weather conditions for a location.',
  usage: '.weather <location>',
  aliases: [],
  cooldownMs: 4000,
  options: [{ name: 'location', type: 'string', description: 'City name, e.g. "Tokyo" or "Portland,US"', required: true, rest: true }],
  async execute(ctx) {
    if (!config.env.openWeatherApiKey) {
      return ctx.replyError('Not configured', 'The bot host has not set `OPENWEATHER_API_KEY` — see .env.example.');
    }
    const location = ctx.getOption('location');

    await ctx.defer();
    let data;
    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { q: location, appid: config.env.openWeatherApiKey, units: 'metric' },
        timeout: 10_000,
        validateStatus: (status) => status < 500,
      });
      if (response.status === 404) return ctx.replyError('Unknown location', `OpenWeather has no station for \`${location}\`.`);
      if (response.status === 401) return ctx.replyError('Bad API key', 'OpenWeather rejected the configured key.');
      if (response.status !== 200) return ctx.replyError('Lookup failed', `OpenWeather returned HTTP ${response.status}.`);
      data = response.data;
    } catch (error) {
      return ctx.replyError('Lookup failed', `Could not reach OpenWeather: ${error.message}`);
    }

    const condition = data.weather?.[0] ?? { main: 'Unknown', description: 'unknown' };
    const emoji = CONDITION_EMOJI[condition.main] ?? '🌍';
    const celsius = data.main?.temp;
    const fahrenheit = celsius !== undefined ? (celsius * 9) / 5 + 32 : undefined;

    const embed = brandEmbed()
      .setTitle(`${emoji} Weather — ${data.name}${data.sys?.country ? `, ${data.sys.country}` : ''}`)
      .setDescription(`**${condition.description}**`)
      .addFields(
        { name: 'Temperature', value: `${celsius?.toFixed(1)}°C / ${fahrenheit?.toFixed(1)}°F`, inline: true },
        { name: 'Feels like', value: `${data.main?.feels_like?.toFixed(1)}°C`, inline: true },
        { name: 'Humidity', value: `${data.main?.humidity}%`, inline: true },
        { name: 'Pressure', value: `${data.main?.pressure} hPa`, inline: true },
        { name: 'Wind', value: `${data.wind?.speed} m/s`, inline: true },
        { name: 'Cloud cover', value: `${data.clouds?.all ?? 0}%`, inline: true }
      );
    return ctx.reply({ embeds: [embed] });
  },
};
