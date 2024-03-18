import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const MapContainer = () => {
  const [map, setMap] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setOrigin(userLocation);
        setMap(userLocation);
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }, []);

  const onMapClick = (event) => {
    const newUserLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    setMap(newUserLocation);
  };

  const calculateDistance = () => {
    if (origin && map) {
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [map],
          travelMode: 'DRIVING'
        },
        (response, status) => {
          if (status === 'OK') {
            setDistance(response.rows[0].elements[0].distance.text);
          } else {
            console.error('Error:', status);
          }
        }
      );
    }
  };

  useEffect(() => {
    calculateDistance();
  }, [origin, map]);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <LoadScript
        googleMapsApiKey="AIzaSyDMvHTvx8oVrT5NDIXLck6aqLacu3tIHU8"
      >
        <GoogleMap
          mapContainerStyle={{
            height: '100%',
            width: '100%'
          }}
          zoom={13}
          center={origin}
          onClick={onMapClick}
        >
          {map && (
            <Marker
              position={map}
              label="Current Location"
            />
          )}
        </GoogleMap>
      </LoadScript>
      {distance && (
        <p>Distance from origin: {distance}</p>
      )}
    </div>
  );
};

export default MapContainer;
