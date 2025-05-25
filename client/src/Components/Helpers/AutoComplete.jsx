import React, { useState } from 'react';

const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN;

export default function AutoComplete({ setCity, setLat, setLng }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_TOKEN}&q=${encodeURIComponent(
          value
        )}&limit=5&normalizecity=1&dedupe=1&format=json`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  const handleSelect = (place) => {
    const fullName = place.display_name;
    const latVal = parseFloat(place.lat);
    const lonVal = parseFloat(place.lon);

    setQuery(fullName);
    setSelectedLocation({
      name: fullName,
      lat: latVal,
      lng: lonVal,
    });

    setCity(fullName);
    setLat(latVal);
    setLng(lonVal);
    setSuggestions([]);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        type="text"
        placeholder="Enter your location"
        className="w-full p-2 border rounded"
        value={query}
        onChange={handleInputChange}
      />

      {suggestions?.length > 0 && (
        <ul className="border rounded mt-1 bg-white max-h-48 overflow-auto shadow">
          {suggestions.map((place, idx) => (
            <li
              key={idx}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(place)}
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}

      {selectedLocation && (
        <div className="mt-4 p-2 bg-green-100 rounded">
          <strong>Selected:</strong> {selectedLocation.name}
          <br />
          <strong>Latitude:</strong> {selectedLocation.lat}
          <br />
          <strong>Longitude:</strong> {selectedLocation.lng}
        </div>
      )}
    </div>
  );
}
