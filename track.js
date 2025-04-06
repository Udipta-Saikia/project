import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// 🔧 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDOURdB1SE018tDRe9RxVp7PIV8oDnLbzs",
  authDomain: "map-journal-5738f.firebaseapp.com",
  projectId: "map-journal-5738f",
  storageBucket: "map-journal-5738f.appspot.com",
  messagingSenderId: "754274852438",
  appId: "1:754274852438:web:3a1d490a8b95a55544e5f7",
  measurementId: "G-VXDJVT0ZG3"
};

// 🔌 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserId = null;
let map, marker, selectedPlaceName = "";

// 🔐 Auth check
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
    initMap();
  } else {
    window.location.href = "index.html";
  }
});

// 🗺️ Map Setup
function initMap() {
  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  L.Control.geocoder({
    defaultMarkGeocode: false
  })
    .on("markgeocode", function (e) {
      const center = e.geocode.center;
      selectedPlaceName = e.geocode.name;
      map.setView(center, 10);
      if (marker) marker.remove();
      marker = L.marker(center).addTo(map);
    })
    .addTo(map);
}

// 🔍 Manual Place Search
window.searchPlace = function () {
  const place = document.getElementById("placeInput").value.trim();
  if (!place) return alert("Please enter a place name");

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        selectedPlaceName = data[0].display_name;
        map.setView([lat, lon], 10);
        if (marker) marker.remove();
        marker = L.marker([lat, lon]).addTo(map);
      } else {
        alert("Place not found");
      }
    })
    .catch(() => alert("Error fetching location"));
};

// 📸 Convert file to Base64
function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // base64 string
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 💾 Save to Firestore
window.saveToFirebase = async function () {
  if (!marker) return alert("📍 Please mark a location on the map first.");

  const description = document.getElementById("description").value.trim();
  const fileInput = document.getElementById("photoInput");
  const imageUrlInput = document.getElementById("imageUrlInput").value.trim();
  const files = fileInput.files;

  let imageUrl = "";

  try {
    if (imageUrlInput) {
      imageUrl = imageUrlInput;
    } else if (files.length > 0) {
      const base64 = await convertToBase64(files[0]); // just first file
      imageUrl = base64;
    }

    await addDoc(collection(db, "users", currentUserId, "locations"), {
      placeName: selectedPlaceName || "Unknown Location",
      lat: marker.getLatLng().lat,
      lon: marker.getLatLng().lng,
      description: description,
      imageUrl: imageUrl,  // ✅ Stored as string now
      timestamp: new Date()
    });

    alert("✅ Location saved!");

    // Reset form
    document.getElementById("description").value = "";
    document.getElementById("placeInput").value = "";
    document.getElementById("imageUrlInput").value = "";
    fileInput.value = "";
    selectedPlaceName = "";
    if (marker) {
      marker.remove();
      marker = null;
    }
    map.setView([20, 0], 2);
  } catch (error) {
    console.error("❌ Error saving:", error);
    alert("❌ Failed to save. Check console for details.");
  }
};
