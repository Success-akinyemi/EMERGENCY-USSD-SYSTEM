import React, { useState } from 'react';

const MAPBOX_TOKEN = `${import.meta.env.VITE_MAPBOX_TOKEN}`

export default function MapBoxAutoComplete({ city, lat, lng }) {
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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
      );
      const data = await res.json();
      setSuggestions(data.features);
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  const handleSelect = (place) => {
    setQuery(place.place_name);
    setSelectedLocation({
      name: place.place_name,
      lng: place.geometry.coordinates[0],
      lat: place.geometry.coordinates[1],
    });
    city = place.place_name;
    lng = place.geometry.coordinates[0];
    lat = place.geometry.coordinates[1];
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
          {suggestions.map((place) => (
            <li
              key={place.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(place)}
            >
              {place.place_name}
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
