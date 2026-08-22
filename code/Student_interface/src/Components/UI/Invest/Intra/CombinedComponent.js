import React, {useRef, useState} from "react";
import ThreeD from "../../resources/ThreeD";
import BlackBoxWithButton from "./BlackBoxWithButton";
import ExaminationQuestionsContainer from "../../../ExaminationQuestions/ExaminationQuestionsContainer";

const CombinedComponent = () => {
    const [unityData, setUnityData] = useState(null);
    const sendToUnityRef = useRef(null);
    const [isUnityReady, setIsUnityReady] = useState(false);

    // Clicking into the Unity canvas engages the browser's Pointer Lock API,
    // which Unity uses for mouse-look camera control -- once locked, ALL
    // mouse movement and clicks go to Unity, regardless of where on the page
    // the cursor visually is, including over the question/dental chart box
    // to the left. The old platform's answer was "press Escape to release
    // pointer lock" (still in Instructions.js's "Screen Control" bullet),
    // but that only works if the current Unity build still uses pointer lock
    // the same way and honors Escape -- something not verifiable from the
    // web code alone. This button doesn't depend on any of that: setting
    // pointer-events:none on the Unity container means the browser never
    // delivers mouse events to the canvas at all while locked, so it can't
    // capture input no matter what Unity is doing internally.
    const [is3DLocked, setIs3DLocked] = useState(false);

    const handleUnityData = (data) => {
        console.log("Data received from Unity:", data);
        setUnityData(data);
    };

    const getSendMessageToUnity = (sendMessage) => {
        sendToUnityRef.current = sendMessage;
        setIsUnityReady(true); // This will trigger a re-render
        console.log("getSendMessageToUnity called, function: ", sendMessage);
    };
    // Adjust the main container to lay out items horizontally
    const containerStyle = {
        display: "flex",
        flexDirection: "row", // Side-by-side layout
        width: "100%",
        height: "100vh", // Fill the viewport height
        alignItems: "stretch", // Stretch children to fill the height
    };

    // Define the left side container that will hold both instruction and question components
    const leftContainerStyle = {
        display: "flex",
        flexDirection: "column", // Children will be laid out vertically
        width: "30%", // Adjust width as needed
        borderRight: "2px solid black", // Add border to separate from the Unity component
    };

    // Define styles for the instruction box and question box
    const instructionBoxStyle = {
        flexGrow: 1, // Allow it to grow and fill the space
        overflow: "auto", // Add scroll if content is too long
        // Add additional styling here
    };

    const questionBoxStyle = {
        flexGrow: 1, // Allow it to grow and fill the space
        // Add additional styling here
    };

    // Adjust the ThreeD container style
    // Adjust the ThreeD container style
    const threeDContainerStyle = {
        flexGrow: 2, // Unity WebGL will take up the remaining space after the left side
        width: "calc(70% - 20px)", // Subtract the desired margin from the width
        marginRight: "20px", // Add a margin to the right of the Unity component
        display: "flex",
        flexDirection: "column",
    };

    const lockButtonStyle = {
        margin: "8px 0",
        padding: "8px 16px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
        color: "white",
        backgroundColor: is3DLocked ? "#c0392b" : "#27ae60",
        alignSelf: "flex-start",
    };

    return (
        <div style={containerStyle}>
            <div style={leftContainerStyle}>
                <div style={instructionBoxStyle}></div>
                <div style={questionBoxStyle}>
                    {isUnityReady && ( <ExaminationQuestionsContainer unityData={unityData} sendToUnity={sendToUnityRef.current}/>)}
                </div>
            </div>
            <div style={threeDContainerStyle}>
                <button
                    type="button"
                    style={lockButtonStyle}
                    onClick={() => setIs3DLocked((prev) => !prev)}
                >
                    {is3DLocked ? "🔒 3D View Locked — Click to Unlock" : "🔓 Lock 3D View"}
                </button>
                {/* This wrapper, not ThreeD itself, gets pointer-events:none --
                    disabling input on the Unity component directly would also
                    stop it receiving the click that re-enables it. */}
                <div style={{ flex: 1, pointerEvents: is3DLocked ? "none" : "auto" }}>
                    <ThreeD onUnityData={handleUnityData} onSendMessageToUnity={getSendMessageToUnity}/>
                </div>
            </div>
        </div>
    );
};

export default CombinedComponent;
