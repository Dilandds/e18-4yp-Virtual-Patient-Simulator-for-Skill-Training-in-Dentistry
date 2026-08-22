import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import { useSelector, useDispatch } from "react-redux";
import { UserActions } from "../../Actions/User/UserActions.js";
import Swal from "sweetalert2";
import CaseSelect from "../UI/CaseSelect.js";
import img3 from "../../Images/UI_BackGround.jpg";
import { TimeActions } from "../../Actions/Time/TimeActions.js";
import firebase from "../../Config/Config.js";

// NOTE: sign-in was switched from Google Identity Services' embedded
// popup/iframe flow (google.accounts.id) to Firebase Auth's full-page
// OAuth redirect flow (signInWithRedirect). The embedded flow requires
// loading an accounts.google.com iframe that needs the browsing context
// to NOT be cross-origin isolated; this page must be cross-origin
// isolated (COOP/COEP) for the Unity WebGL build's threaded runtime to
// work, so the two were mutually exclusive under the old flow. A
// full-page redirect doesn't embed anything cross-origin, so it's
// compatible with both.

// Debug logging that survives the full-page OAuth redirect: DevTools
// "Preserve log" isn't reliably surviving the round trip to accounts.google.com
// and back, so write to localStorage instead (which is guaranteed to persist
// across navigation) in addition to console.log. After landing back, run
// `localStorage.getItem("debugLog")` in the console to see the full sequence.
function debugLog(...args) {
  console.log(...args);
  try {
    const line = `[${new Date().toISOString()}] ${args
      .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
      .join(" ")}`;
    const existing = localStorage.getItem("debugLog") || "";
    const lines = (existing + "\n" + line).split("\n").slice(-50);
    localStorage.setItem("debugLog", lines.join("\n"));
  } catch (e) {
    // ignore
  }
}

// Accounts allowed to sign in regardless of the pdn.ac.lk check below --
// for a specific known person (e.g. yourself) who wants to try the
// platform but doesn't have a university email. To let someone in, add
// their Google account email here (any case) and redeploy the Student
// interface; remove it to revoke access.
//
// This only works when you know the email in advance. It doesn't help
// with anonymous third-party reviewers -- see GUEST_ACCESS_CODE below for
// that case instead.
const BYPASS_EMAILS = ["dilandds97@gmail.com"];

// For reviewers/testers whose email you *don't* know ahead of time: a
// shared access code that unlocks a one-click guest sign-in (no Google
// account, no pdn.ac.lk check at all), shown as a second option on the
// login screen below. This is the actual equivalent of the tutor side's
// hardcoded test@demo.com/Test1234 credential (see
// Backend/functions/routes/teacherRoutes.js) -- a single shortcut anyone
// who has it can use, rather than a per-person allowlist.
//
// Change this string and redeploy whenever you want to invalidate it (e.g.
// after a review period ends), and only share it with the people who
// should have it. Like BYPASS_EMAILS, this ships in the client bundle and
// is visible to anyone who opens devtools -- it deters casual use, it
// doesn't stop someone determined to find it, so don't treat it as a real
// secret.
const GUEST_ACCESS_CODE = "vps-review-2026";

function SignIn() {
  const [user, setUser] = useState({});
  const [guestCode, setGuestCode] = useState("");
  const [guestError, setGuestError] = useState("");
  const isSignIn = useSelector((state) => state.user.isSignIn);
  const dispatch = useDispatch();

  // Shared by the real Google sign-in path and the guest-code path below --
  // both just need to record who's "logged in" locally; nothing here talks
  // to Firebase Auth.
  function signInLocally(userObject) {
    setUser(userObject);
    localStorage.setItem("user", JSON.stringify(userObject));
    dispatch(UserActions.getCurrentUserDetails(userObject));
    dispatch(TimeActions.setStartTime());
  }

  function completeSignIn(userObject) {
    debugLog("completeSignIn called with:", userObject);
    var text = userObject.email || "";
    var isBypassEmail = BYPASS_EMAILS.some(
      (allowed) => allowed.toLowerCase() === text.toLowerCase()
    );
    if (isBypassEmail || text.match("pdn.ac.lk")) {
      debugLog(
        isBypassEmail ? "bypass email matched" : "pdn.ac.lk check passed",
        ", setting signed-in state"
      );
      signInLocally(userObject);
    } else {
      debugLog("pdn.ac.lk check FAILED for email:", JSON.stringify(text));
      showAlert();
      firebase.auth().signOut();
    }
  }

  // Guest path: no Google account needed at all, just the shared access
  // code. Each guest gets a random id so multiple reviewers signing in at
  // the same time don't collide on the same student results doc (see
  // examResultsRoutes.js, which stores results per studentId).
  function handleGuestAccess() {
    if (guestCode.trim() !== GUEST_ACCESS_CODE) {
      setGuestError("That code isn't right. Check with whoever gave it to you.");
      return;
    }
    setGuestError("");
    const guestId = "guest-" + Math.random().toString(36).slice(2, 10);
    debugLog("guest access code accepted, signing in as:", guestId);
    signInLocally({
      email: `${guestId}@guest.vps-demo`,
      name: "Guest Reviewer",
      picture: null,
      sub: guestId,
    });
  }

  function showAlert() {
    Swal.fire({
      title: "Login Failed",
      text: "Use your Dental student account to ",
      icon: "fail",
      confirmButtonText: "OK",
    });
  }

  // Popup rather than redirect. signInWithRedirect navigates away to
  // authDomain (vps-2k25-app.firebaseapp.com) and has to hand the result
  // back to this origin (vps-2k25-app-student.firebaseapp.com) through
  // browser storage. Those are different domains, so storage partitioning
  // silently drops the handoff: sign-in succeeds on Google's side but
  // neither getRedirectResult() nor onAuthStateChanged ever resolves here.
  // A popup keeps this page alive and passes the credential back over
  // postMessage to window.opener, so no cross-domain storage is involved.
  function handleSignInClick() {
    debugLog("sign-in button clicked, opening popup");
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        debugLog(
          "signInWithPopup resolved, user email:",
          result && result.user && result.user.email
        );
        // onAuthStateChanged also fires and calls completeSignIn; this is
        // just for visibility into the popup's own outcome.
      })
      .catch((error) => {
        debugLog(
          "signInWithPopup FAILED:",
          error && error.code,
          error && error.message
        );
        // Don't show the "wrong account" alert for a user-cancelled popup.
        if (
          error &&
          error.code !== "auth/popup-closed-by-user" &&
          error.code !== "auth/cancelled-popup-request"
        ) {
          showAlert();
        }
      });
  }

  useEffect(() => {
    debugLog("mount effect running, location:", window.location.href);
    const savedUser = localStorage.getItem("user");
    debugLog("localStorage 'user':", savedUser);
    if (savedUser) {
      const userObject = JSON.parse(savedUser);
      setUser(userObject);
      dispatch(UserActions.getCurrentUserDetails(userObject));
    }

    // getRedirectResult() is a "consume once" API — this app's Redux store
    // also wires up react-redux-firebase / redux-firestore (see index.js),
    // which sets up its own Firebase Auth listener during store creation,
    // before this component ever mounts. If that listener reads the
    // pending redirect result first, our own getRedirectResult() call here
    // legitimately comes back empty even though sign-in succeeded. Still
    // call it so a genuine redirect ERROR (e.g. unauthorized-domain) surfaces,
    // but don't rely on its resolved value to detect a successful sign-in.
    firebase
      .auth()
      .getRedirectResult()
      .then((result) => {
        debugLog(
          "getRedirectResult resolved, user email:",
          result && result.user && result.user.email
        );
      })
      .catch((error) => {
        debugLog("getRedirectResult FAILED:", error && error.code, error && error.message);
        showAlert();
      });

    // onAuthStateChanged is the reliable source of truth: it fires whenever
    // Firebase's auth state changes, including right after a redirect
    // completes, regardless of who else already touched getRedirectResult().
    const unsubscribe = firebase.auth().onAuthStateChanged((fbUser) => {
      debugLog("onAuthStateChanged fired, fbUser:", fbUser && fbUser.email);
      if (fbUser) {
        const userObject = {
          email: fbUser.email,
          name: fbUser.displayName,
          picture: fbUser.photoURL,
          sub: fbUser.uid,
        };
        completeSignIn(userObject);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (Object.keys(user).length === 0 || !isSignIn) {
    return (
      <div
        className="background"
        style={{
          backgroundImage: `url(${img3})`,
          height: "100vh",
          marginTop: "0px",
          fontSize: "18px",
          backgroundSize: "cover",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
        }}
      >
        <div className="header">
          <h1>Virtual Patient Simulator</h1>
          <h2>for Skill Training in Dentistry </h2>
        </div>
        <div className="authent">
          <Button
            className="relative"
            id="signInDiv"
            variant="light"
            onClick={handleSignInClick}
          >
            Sign in with Google
          </Button>
          <p id="errorM"></p>
        </div>
        <div
          className="authent"
          style={{ marginTop: "24px", textAlign: "center" }}
        >
          <p style={{ marginBottom: "8px" }}>
            Reviewing or testing the platform? Enter your access code:
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <input
              type="text"
              value={guestCode}
              onChange={(e) => setGuestCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGuestAccess();
              }}
              placeholder="Access code"
              style={{ padding: "6px 10px", borderRadius: "4px", border: "none" }}
            />
            <Button variant="secondary" onClick={handleGuestAccess}>
              Continue as Guest
            </Button>
          </div>
          {guestError && (
            <p style={{ color: "#ffb3b3", marginTop: "8px" }}>{guestError}</p>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <CaseSelect />
      </div>
    );
  }
}

export default SignIn;
