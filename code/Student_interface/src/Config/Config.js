// Old, abandoned "vitual-patient" project config, kept for reference only.
// Auth on that project used a different authDomain than this app's actual
// hosting domain (vps-2k25-app-student.web.app), which broke the
// signInWithRedirect flow: browsers' storage-partitioning treated the
// cross-project handoff as third-party and silently dropped the session.
// var config = {
//   apiKey: "AIzaSyDMGgEtQXmO1y4HWRfhaJmUVWLnOdl9H7A",
//   authDomain: "vitual-patient.firebaseapp.com",
//   projectId: "vitual-patient",
//   storageBucket: "vitual-patient.appspot.com",
//   messagingSenderId: "305839887405",
//   appId: "1:305839887405:web:8f24039875fbba469f94a4",
//   measurementId: "G-CSFMP3D73X",
// };

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/storage";

// vps-2k25-app — the same project that owns Hosting, the Backend
// Functions, and the real case data (see .firebaserc / firebase.json).
var config = {
  apiKey: "AIzaSyD1sx4Ct2PU98FAwCHIgV4yVKGrwVocz0g",
  authDomain: "vps-2k25-app.firebaseapp.com",
  projectId: "vps-2k25-app",
  storageBucket: "vps-2k25-app.firebasestorage.app",
  messagingSenderId: "1092448104327",
  appId: "1:1092448104327:web:993414a5ea62b4a3266d22",
  measurementId: "G-KJ4LE14139",
};
firebase.initializeApp(config);
firebase.firestore().settings({ timestampsInSnapshots: true });
firebase.storage();
export default firebase;
