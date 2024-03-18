import React, { useEffect, useState } from "react";
import { getDistance } from "geolib";

const GoogleMapComponent = () => {
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [path, setPath] = useState([]);
  const [polyline, setPolyline] = useState(null);
  const [currentLocation, setCurrentLocation] = useState({});
  const [totalDistance, setTotalDistance] = useState(0); // Added state for total distance

  useEffect(() => {
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(
        document.getElementById("map"),
        {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 12,
        }
      );
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
    return () => {
      if (userMarker) {
        userMarker.setMap(null);
      }
    };
  }, [userMarker]);

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
              userMarker.setMap(null);
            }

            const newMarker = new window.google.maps.Marker({
              position: userLocation,
              map: map,
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
              },
            });

            setUserMarker(newMarker);

            map.setCenter(userLocation);
            // map.setZoom(15);

            // Calculate distance between consecutive positions
            if (path.length > 0) {
              const previousLocation = path[path.length - 1];
              const distance = calculateDistance(
                previousLocation,
                userLocation
              );

              setTotalDistance((prevDistance) => prevDistance + distance);
            }

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
  }, [map, userMarker]);

  useEffect(() => {
    if (path.length > 1 && map) {
      if (polyline) {
        polyline.setMap(null);
      }
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
  }, [path, map, polyline]);

  const calculateDistance = (from, to) => {
    return getDistance(from, to);
  };

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

  // const computeTotalDistance = (result) => {
  //   let totalDistance = 0;
  //   const myRoute = result.routes[0];
  //   for (let i = 0; i < myRoute.legs.length; i++) {
  //     totalDistance += myRoute.legs[i].distance.value;
  //   }
  //   const totalDistanceInKm = totalDistance / 1000;
  //   document.getElementById("distance").innerHTML =
  //     "Total distance: " + totalDistanceInKm + " km";
  // };
  const computeTotalDistance = (result) => {
    let totalDistance = 0;
    const myRoute = result.routes[0];
    for (let i = 0; i < myRoute.legs.length; i++) {
      totalDistance += myRoute.legs[i].distance.value;
    }
    const totalDistanceInKm = totalDistance / 1000; // Convert to kilometers
    document.getElementById("distance").innerHTML =
      "Total distance: " + totalDistanceInKm.toFixed(2) + " km"; // Display with 2 decimal places
  };
  

  const computeTotalDuration = (result) => {
    let totalDuration = 0;
    const myRoute = result.routes[0];
    for (let i = 0; i < myRoute.legs.length; i++) {
      totalDuration += myRoute.legs[i].duration.value;
    }
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    document.getElementById("duration").innerHTML 
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
      <div id="total-distance">
        Total distance traveled: {totalDistance.toFixed(2)} Kilometer
      </div>
    </div>
  );
};

export default GoogleMapComponent;
