import React from 'react';

const QuestionBox = ({ children }) => {
    // height was a fixed 400px, which clipped/hid content once question and
    // answer images were made bigger and easier to read -- minHeight keeps
    // the box from looking too small on short questions, but lets it grow
    // for taller ones instead of cutting them off.
    const questionBoxStyle = {
        border: "1px solid black",
        padding: "20px",
        fontSize: "16px",
        marginTop: "20px",
        width: "300px",
        minHeight: "400px",
    };

    return (
        <div style={questionBoxStyle}>
            {children}
        </div>
    );
};

export default QuestionBox;
