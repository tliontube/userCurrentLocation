import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';

const MapContainer = () => {
  const [map, setMap] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [distance, setDistance] = useState(0);
  const [previousPosition, setPreviousPosition] = useState(null);
  const [path, setPath] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition((position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (!origin) {
          setOrigin(userLocation);
          setPreviousPosition(userLocation);
          setMap(userLocation);
          setPath([userLocation]);
        } else {
          const distanceMoved = calculateDistance(previousPosition, userLocation);
          setDistance(distance + distanceMoved);
          setPreviousPosition(userLocation);
          setPath(prevPath => [...prevPath, userLocation]);
        }
      });

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }, [origin, distance]);

  const onMapClick = (event) => {
    const newUserLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    setMap(newUserLocation);
  };

  
  const calculateDistance = (pos1, pos2) => {
    if (!pos1 || !pos2) return 0;

    const rad = (x) => {
      return (x * Math.PI) / 180;
    };

    const R = 6378137; // Earth’s mean radius in meters
    const dLat = rad(pos2.lat - pos1.lat);
    const dLong = rad(pos2.lng - pos1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(pos1.lat)) * Math.cos(rad(pos2.lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // returns the distance in meters
  };

  return (
    <div style={{ height: '500px', width: '380px' }}>
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
            <>
              <Marker position={map} />
              <Polyline
                path={path}
                options={{
                  strokeColor: '#FF0000',
                  strokeOpacity: 1.0,
                  strokeWeight: 2
                }}
              />
            </>
          )}
        </GoogleMap>
      </LoadScript>
      <p>Distance traveled: {distance.toFixed(2)} meters</p>
    </div>
  );
};

export default MapContainer;
 