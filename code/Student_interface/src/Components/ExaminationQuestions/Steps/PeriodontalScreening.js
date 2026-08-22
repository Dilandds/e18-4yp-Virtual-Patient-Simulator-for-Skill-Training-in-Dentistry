import React from 'react';
import TitleBox from "../TitleBox";
import QuestionBox from "../QuestionBox";
import QuestionComponent from "../QuestionComponent";
import { useExamSection } from "../useExamSection";

const PeriodontalScreening = ({ onComplete }) => {
    const boxStyle = {
        width: "30%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "start",
        marginRight: "300px",
    };

    const buttonStyle = {
        fontSize: "14px",
        width: "300px",
        padding: "10px 20px",
        backgroundColor: "dodgerblue",
    };

    const { loading, currentQuestion, toggleAnswer, handleSubmit } =
        useExamSection("PeriodontalScreeningQuestions", onComplete);

    const title = "INTRA ORAL EXAMINATION";
    const subTitle = "Periodontal Screening";

    return (
        <div style={boxStyle}>
            <TitleBox title={title} subTitle={subTitle} />
            <QuestionBox>
                {!loading && currentQuestion && (
                    <QuestionComponent question={currentQuestion} onAnswerChange={toggleAnswer} />
                )}
            </QuestionBox>
            <button style={buttonStyle} onClick={handleSubmit}>
                SUBMIT
            </button>
        </div>
    );
};

export default PeriodontalScreening;
