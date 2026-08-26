import React from "react";

// Renders one question's answer choices. Radio buttons for a tutor-marked
// single-answer question, checkboxes for a multi-answer one, so a student
// can only over-select on questions the tutor actually allowed that on.
//
// Previously this rendered inert checkboxes with no onChange handler at
// all -- `checked` was hardcoded false and clicking one did nothing. That's
// why answers were never being captured anywhere.
//
// Each choice is keyed by its position ("choice-0", ...), not by its own
// text -- see useExamSection.js. Image-only choices are saved with blank
// text, and using that blank text as the key/label used to make every
// image-only choice but the last disappear (object keys collide), which is
// why a "select the right diagram" question only ever showed one picture.
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
          style={{ width: "100%", maxWidth: "260px", marginBottom: "10px" }}
        />
      )}
      {answers && (
        <form>
          {Object.entries(answers).map(([key, { text, isChecked, imageUrl }]) => (
            <div key={key}>
              {(text || imageUrl) && (
                <label>
                  <input
                    type={isMultiAnswer ? "checkbox" : "radio"}
                    name={isMultiAnswer ? key : "answer"}
                    checked={isChecked}
                    onChange={() => onAnswerChange && onAnswerChange(key)}
                  />
                  {text}
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={text || "Answer option"}
                      style={{ width: "90px", marginLeft: "10px", verticalAlign: "middle" }}
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
