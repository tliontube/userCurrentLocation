import React, { useEffect, useState } from "react";

const GoogleMapComponent = () => {
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [path, setPath] = useState([]);
  const [polyline, setPolyline] = useState(null);
  const [currentLocation, setCurrentLocation] = useState({});
  const [totalDistance, setTotalDistance] = useState(0);
  const [originSet, setOriginSet] = useState(false);

  useEffect(() => {
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 12,
      });
      setMap(mapInstance);
      setDirectionsService(new window.google.maps.DirectionsService());
      const renderer = new window.google.maps.DirectionsRenderer();
      renderer.setMap(mapInstance);
      setDirectionsRenderer(renderer);
    };

    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDMvHTvx8oVrT5NDIXLck6aqLacu3tIHU8&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = initMap;
    } else {
      initMap();
    }
  }, []);

  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCurrentLocation(userLocation);
            if (userMarker) {
              userMarker.setPosition(userLocation); // Update marker position
            } else {
              const newMarker = new window.google.maps.Marker({
                position: userLocation,
                map: map,
                icon: {
                  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                },
              });
              setUserMarker(newMarker);
              setOriginSet(true);
            }

            map.setCenter(userLocation);

            setPath((prevPath) => [...prevPath, userLocation]);
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
      } else {
        console.error("Geolocation is not supported.");
      }
    };

    getUserLocation();

    return () => {
      // Clean up resources
      if (userMarker) {
        userMarker.setMap(null);
      }
    };
  }, [map, userMarker]);

  useEffect(() => {
    if (path.length > 1 && map) {
      if (polyline) {
        polyline.setPath(path);
      } else {
        const newPath = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2,
        });
        newPath.setMap(map);
        setPolyline(newPath);
      }

      let distance = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        distance += window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(p1.lat, p1.lng),
          new window.google.maps.LatLng(p2.lat, p2.lng)
        );
      }
      distance = distance / 1000;
      setTotalDistance(distance);
    }
  }, [path, map, polyline]);

  const calculateAndDisplayRoute = () => {
    const origin = currentLocation;
    const destination = document.getElementById("destination").value;

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(response);
          computeTotalDistance(response);
          computeTotalDuration(response);
        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    );
  };

  const computeTotalDistance = (result) => {
    let totalDistance = 0;
    const myRoute = result.routes[0];
    for (let i = 0; i < myRoute.legs.length; i++) {
      totalDistance += myRoute.legs[i].distance.value;
    }
    const totalDistanceInKm = totalDistance / 1000;
    document.getElementById("distance").innerHTML =
      "Total distance: " + totalDistanceInKm + " km";
  };

  const computeTotalDuration = (result) => {
    let totalDuration = 0;
    const myRoute = result.routes[0];
    for (let i = 0; i < myRoute.legs.length; i++) {
      totalDuration += myRoute.legs[i].duration.value;
    }
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    document.getElementById("duration").innerHTML =
      "Estimated time: " + hours + " hours " + minutes + " minutes";
  };

  return (
    <div>
      <h1>Google Maps Directions, Distance, Time, and User Location</h1>
      <input type="text" id="destination" placeholder="Destination" />
      <button onClick={calculateAndDisplayRoute}>Get Directions</button>
      <div id="map" style={{ height: "400px", width: "100%" }}></div>
      <div id="distance"></div>
      <div id="duration"></div>
      <p>Total Distance: {totalDistance.toFixed(2)} km</p>
    </div>
  );
};

export default GoogleMapComponent;
