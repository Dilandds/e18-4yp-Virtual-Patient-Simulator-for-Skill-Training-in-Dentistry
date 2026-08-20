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

function SignIn() {
  const [user, setUser] = useState({});
  const isSignIn = useSelector((state) => state.user.isSignIn);
  const dispatch = useDispatch();

  function completeSignIn(userObject) {
    var text = userObject.email || "";
    if (text.match("pdn.ac.lk")) {
      setUser(userObject);
      localStorage.setItem("user", JSON.stringify(userObject));
      dispatch(UserActions.getCurrentUserDetails(userObject));
      dispatch(TimeActions.setStartTime());
    } else {
      showAlert();
      firebase.auth().signOut();
    }
  }

  function showAlert() {
    Swal.fire({
      title: "Login Failed",
      text: "Use your Dental student account to ",
      icon: "fail",
      confirmButtonText: "OK",
    });
  }

  function handleSignInClick() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  }

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
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
      .catch((error) => {
        console.error("Google sign-in redirect failed:", error);
        showAlert();
      });

    // onAuthStateChanged is the reliable source of truth: it fires whenever
    // Firebase's auth state changes, including right after a redirect
    // completes, regardless of who else already touched getRedirectResult().
    const unsubscribe = firebase.auth().onAuthStateChanged((fbUser) => {
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
