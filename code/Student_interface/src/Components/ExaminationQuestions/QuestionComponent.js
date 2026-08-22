import React from "react";
import CheckboxQuestion from "./questionType/CheckboxQuestion";

const QuestionComponent = ({ question, onAnswerChange }) => {
  return (
    <div>
      <CheckboxQuestion question={question} onAnswerChange={onAnswerChange} />
    </div>
  );
};

export default QuestionComponent;
