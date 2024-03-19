import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, push, child } from "firebase/database";

const MapContainer = () => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [user, setUser] = useState(null); // Track user's sign-in status

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

  const handleSignInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        setUser(user);
      })
      .catch((error) => {
        console.error("Google sign-in error:", error);
      });
  };

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
      const watchId = navigator.geolocation.watchPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, [user]);

  useEffect(() => {
    const db = getDatabase();
    const locationRef = ref(db, "locations");
    if (userLocation && user) {
      const userLocationRef = child(locationRef, user.uid);
      push(userLocationRef, userLocation);
    }
  }, [userLocation, user]);

  return (
    <div style={{ height: "500px", width: "380px" }}>
      {user ? (
        <LoadScript googleMapsApiKey="AIzaSyDMvHTvx8oVrT5NDIXLck6aqLacu3tIHU8">
          <GoogleMap
            mapContainerStyle={{
              height: "100%",
              width: "100%",
            }}
            zoom={13}
            center={userLocation}
          >
            {userLocation && <Marker position={userLocation} />}
          </GoogleMap>
        </LoadScript>
      ) : (
        <>
          <input type="email" placeholder="Email" id="email" />
          <input type="password" placeholder="Password" id="password" />
          <button onClick={() => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            handleSignInWithEmailAndPassword(email, password);
          }}>Sign in</button>
          <button onClick={() => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            handleSignUpWithEmailAndPassword(email, password);
          }}>Sign up</button>
          <button onClick={handleSignInWithGoogle}>Sign in with Google</button>
        </>
      )}
    </div>
  );
};

export default MapContainer;
