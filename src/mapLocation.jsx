import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth,signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, push, child } from "firebase/database";

const MapContainer = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [user, setUser] = useState(null); // Track user's sign-in status
  const [placeName, setPlaceName] = useState("");
  const [speed, setSpeed] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [heading, setHeading] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const MOVEMENT_THRESHOLD = 10;

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

  const handleSignInWithEmailAndPassword = async (email, password) => {
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUser(user);
    } catch (error) {
      console.error("Email/password sign-in error:", error);
    }
  };

  const handleSignUpWithEmailAndPassword = async (email, password) => {
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUser(user);
    } catch (error) {
      console.error("Email/password sign-up error:", error);
    }
  };

  useEffect(() => {
    if (navigator.geolocation && user) {
      const watchId = navigator.geolocation.watchPosition(
        position => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(prevLocation => {
            // Calculate distance between previous and new position
            const distance = calculateDistance(prevLocation, newPosition);
            fetchPlaceData(position.coords.latitude, position.coords.longitude);
            // Update location only if distance exceeds threshold
            if (distance >= MOVEMENT_THRESHOLD) {
              setSpeed(position.coords.speed);
              setAccuracy(position.coords.accuracy);
              setHeading(position.coords.heading);
              setRequestCount(prevCount => prevCount + 1);
              return newPosition;
            } else {
              return prevLocation;
            }
          });
        },
        error => {
          console.error("Error getting user location:", error);
        }
      );
  
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, [user]);

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

  const fetchPlaceData = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyDMvHTvx8oVrT5NDIXLck6aqLacu3tIHU8`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const place = data.results[0].formatted_address;
        setPlaceName(place);
      }
    } catch (error) {
      console.error("Error fetching place data:", error);
    }
  };

  useEffect(() => {
    const db = getDatabase();
    const locationRef = ref(db, "locations");
    if (userLocation && user) {
      const userLocationRef = child(locationRef, user.uid);
      push(userLocationRef, userLocation);
    }
  }, [userLocation, user]);

  return (
    <div>
      {!user && (
        <>
          <input type="email" placeholder="Email" id="email" />
          <input type="password" placeholder="Password" id="password" />
          <button
            onClick={() => {
              const email = document.getElementById("email").value;
              const password = document.getElementById("password").value;
              handleSignInWithEmailAndPassword(email, password);
            }}
          >
            Sign in
          </button>
          <button
            onClick={() => {
              const email = document.getElementById("email").value;
              const password = document.getElementById("password").value;
              handleSignUpWithEmailAndPassword(email, password);
            }}
          >
            Sign up
          </button>
        </>
      )}
      {user && (
        <div>
          <p>Place Name: {placeName}</p>
          <p>Speed: {speed}</p>
          <p>Accuracy: {accuracy}</p>
          <p>Heading: {heading}</p>
          <p>Request Count: {requestCount}</p>
        </div>
      )}
    </div>
  );
};

export default MapContainer;
