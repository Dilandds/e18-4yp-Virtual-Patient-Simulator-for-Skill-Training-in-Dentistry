import React from "react";

// Renders one question's answer choices. Radio buttons for a tutor-marked
// single-answer question, checkboxes for a multi-answer one, so a student
// can only over-select on questions the tutor actually allowed that on.
//
// Previously this rendered inert checkboxes with no onChange handler at
// all -- `checked` was hardcoded false and clicking one did nothing. That's
// why answers were never being captured anywhere.
const CheckboxQuestion = ({ question, onAnswerChange }) => {
  const { questionImageUrl, answers, isMultiAnswer } = question;
  const imageSrc = Array.isArray(questionImageUrl)
    ? questionImageUrl[0]
    : questionImageUrl;

  return (
    <div>
      <h5>{question.question}</h5>
      {imageSrc && (
        <img
          src={imageSrc}
          alt="Question"
          style={{ width: "100px", marginBottom: "10px" }}
        />
      )}
      {answers && (
        <form>
          {Object.entries(answers).map(([option, { isChecked, imageUrl }]) => (
            <div key={option}>
              {(option || imageUrl) && (
                <label>
                  <input
                    type={isMultiAnswer ? "checkbox" : "radio"}
                    name={isMultiAnswer ? option : "answer"}
                    checked={isChecked}
                    onChange={() => onAnswerChange && onAnswerChange(option)}
                  />
                  {option}
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={option}
                      style={{ width: "50px", marginLeft: "10px" }}
                    />
                  )}
                </label>
              )}
            </div>
          ))}
        </form>
      )}
    </div>
  );
};

export default CheckboxQuestion;
