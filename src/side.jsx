import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getDatabase, ref, push, child } from "firebase/database";

const MapContainer = () => {
  const [map, setMap] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [distance, setDistance] = useState(0);
  const [previousPosition, setPreviousPosition] = useState(null);
  const [path, setPath] = useState([]);
  const [visitedPlaces, setVisitedPlaces] = useState([]);
  const [placeName, setPlaceName] = useState("");
  const [lastVisitedPlace, setLastVisitedPlace] = useState(null);
  const [user, setUser] = useState(null); // Track user's sign-in status
  const MOVE_THRESHOLD = 50; // Adjust the threshold as needed

  // Initialize Firebase
  useEffect(() => {
    const firebaseConfig = {
      // Your Firebase configuration
      apiKey: "AIzaSyCQaa0vfE5i1qdsqUz4WA7zyXk6b5NDLSE",
      authDomain: "usertracker-f07e5.firebaseapp.com",
      databaseURL: "https://usertracker-f07e5-default-rtdb.firebaseio.com",
      projectId: "usertracker-f07e5",
      storageBucket: "usertracker-f07e5.appspot.com",
      messagingSenderId: "110782558163",
      appId: "1:110782558163:web:23fee6a4389cc26a598926",
      measurementId: "G-T7TBFP9E64",
    };
    initializeApp(firebaseConfig);
  }, []);

  // Handle sign in with Google
  const handleSignInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log("User signed in:", user);
        setUser(user); // Set the user state upon successful sign-in
      })
      .catch((error) => {
        console.error("Google sign-in error:", error);
      });
  };

  // Watch user's geolocation
  useEffect(() => {
    if (navigator.geolocation && user) {
      const watchId = navigator.geolocation.watchPosition((position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (!origin) {
          setOrigin(userLocation);
          setPreviousPosition(userLocation);
          setMap(userLocation);
          setPath([userLocation]);
          fetchPlaceData(userLocation);
        } else {
          const distanceMoved = calculateDistance(
            previousPosition,
            userLocation
          );
          setDistance(distance + distanceMoved);
          setPreviousPosition(userLocation);
          setPath((prevPath) => [...prevPath, userLocation]);
          // Check if the user has moved significantly to add the place to the list
          if (distanceMoved > MOVE_THRESHOLD) {
            fetchPlaceData(userLocation);
          }
        }
      });

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, [origin, distance, user]);

  // Handle map click event
  const onMapClick = (event) => {
    const newUserLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setMap(newUserLocation);
  };

  // Fetch place data based on location
  const fetchPlaceData = async (location) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=AIzaSyDMvHTvx8oVrT5NDIXLck6aqLacu3tIHU8`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const newPlaceName = data.results[0].formatted_address;
        setPlaceName(newPlaceName);
        if (!lastVisitedPlace || lastVisitedPlace !== newPlaceName) {
          setVisitedPlaces((prevPlaces) => [...prevPlaces, newPlaceName]);
          setLastVisitedPlace(newPlaceName);
        }
      }
    } catch (error) {
      console.error("Error fetching place data:", error);
    }
  };

  // Calculate distance between two points on Earth's surface
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
      Math.cos(rad(pos1.lat)) *
        Math.cos(rad(pos2.lat)) *
        Math.sin(dLong / 2) *
        Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // returns the distance in meters
  };

  // Update Firebase database with user's location
  useEffect(() => {
    const db = getDatabase();
    const locationRef = ref(db, "locations");
    if (map && user) {
      const userLocationRef = child(locationRef, user.uid);
      push(userLocationRef, map);
    }
  }, [map, user]);

  // Set up interval to check user's location periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (map) {
        const distanceMoved = calculateDistance(previousPosition, map);
        if (distanceMoved > MOVE_THRESHOLD) {
          fetchPlaceData(map);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [map]);

  return (
    <div style={{ height: "500px", width: "380px" }}>
      {user ? ( // Conditionally render based on user sign-in status
        <LoadScript googleMapsApiKey="AIzaSyDMvHTvx8oVrT5NDIXLck6aqLacu3tIHU8">
          <GoogleMap
            mapContainerStyle={{
              height: "100%",
              width: "100%",
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
                    strokeColor: "#FF0000",
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                  }}
                />
              </>
            )}
          </GoogleMap>
        </LoadScript>
      ) : (
        <button onClick={handleSignInWithGoogle}>Sign in with Google</button>
      )}
      {user && ( // Conditionally render distance, place name, and visited places if user is signed in
        <>
          <p>Distance traveled: {distance.toFixed(2)} meters</p>
          <p>Current Place: {placeName}</p>
          <p>Visited Places:</p>
          <ul>
            {visitedPlaces.map((place, index) => (
              <li key={index}>{place}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default MapContainer;
