import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDOURdB1SE018tDRe9RxVp7PIV8oDnLbzs",
  authDomain: "map-journal-5738f.firebaseapp.com",
  projectId: "map-journal-5738f",
  storageBucket: "map-journal-5738f.appspot.com",
  messagingSenderId: "754274852438",
  appId: "1:754274852438:web:3a1d490a8b95a55544e5f7",
  measurementId: "G-VXDJVT0ZG3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const journalEntriesDiv = document.getElementById("journalEntries");

// 🔐 Load entries for current user only
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userId = user.uid;
    const q = query(collection(db, "users", userId, "locations"));

    try {
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        journalEntriesDiv.innerHTML = "<p style='text-align:center;'>No entries found.</p>";
        return;
      }

      querySnapshot.forEach((doc) => {
        const card = createEntryCard(doc, userId);
        journalEntriesDiv.appendChild(card);
      });
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  } else {
    window.location.href = "index.html";
  }
});

// 📦 Create a journal card
function createEntryCard(docSnap, userId) {
  const data = docSnap.data();
  const docId = docSnap.id;

  const card = document.createElement("div");
  card.className = "entry-card";

  // ✅ Handle imageUrl as a STRING
  if (data.imageUrl && typeof data.imageUrl === "string") {
    const img = document.createElement("img");

    img.src = data.imageUrl;
    img.alt = "Uploaded photo";
    img.className = "entry-image";

    img.onerror = () => {
      console.warn("❌ Image failed to load:", data.imageUrl);
      img.style.display = "none";
    };

    card.appendChild(img);
  }

  const place = document.createElement("h3");
  place.innerText = data.placeName || `📍 (${data.lat?.toFixed(3)}, ${data.lon?.toFixed(3)})`;

  const desc = document.createElement("p");
  desc.innerText = data.description || "No description provided.";
  desc.className = "entry-desc";

  const time = document.createElement("p");
  const date = data.timestamp?.toDate?.() ?? new Date(data.timestamp || Date.now());
  time.innerText = `🕒 ${date.toLocaleString()}`;

  const editBtn = document.createElement("button");
  editBtn.innerText = "✏️ Edit";
  editBtn.className = "edit-btn";
  editBtn.onclick = () => {
    const textarea = document.createElement("textarea");
    textarea.value = data.description;
    textarea.rows = 4;
    textarea.style.width = "100%";

    const saveBtn = document.createElement("button");
    saveBtn.innerText = "💾 Save";
    saveBtn.className = "save-btn";
    saveBtn.onclick = async () => {
      const newDesc = textarea.value.trim();
      if (!newDesc) return alert("Description cannot be empty.");
      try {
        await updateDoc(doc(db, "users", userId, "locations", docId), {
          description: newDesc
        });
        alert("✅ Description updated.");
        location.reload();
      } catch (err) {
        console.error("Error updating:", err);
        alert("❌ Failed to update.");
      }
    };

    desc.replaceWith(textarea);
    editBtn.replaceWith(saveBtn);
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "🗑️ Delete";
  deleteBtn.className = "delete-btn";
  deleteBtn.onclick = async () => {
    const confirmed = confirm("Are you sure you want to delete this entry?");
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "users", userId, "locations", docId));
      alert("🗑️ Entry deleted.");
      location.reload();
    } catch (err) {
      console.error("Error deleting:", err);
      alert("❌ Failed to delete.");
    }
  };

  card.append(place, desc, time, editBtn, deleteBtn);
  return card;
}

// 🔙 Back Button
const backBtn = document.querySelector(".back-button");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "homepage.html";
  });
}
