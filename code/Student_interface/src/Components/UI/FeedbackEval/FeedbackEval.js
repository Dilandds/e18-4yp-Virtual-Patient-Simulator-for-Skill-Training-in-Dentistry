import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Feed.css';

// Shows what the student got right/wrong and their score, once the exam
// flow (ExaminationQuestionSections.js) finishes and navigates here with
// real results. Previously this always rendered a hardcoded
// "Your Total Score: 50" and expected data (CORRECT_ANSWERS, CASE1_QUESTIONS)
// that only the old, single-case BlackBoxWithButton flow ever supplied --
// and nothing in the live app ever navigated here, so it was unreachable.
const FeedbackEval = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sectionResults, examScore, historyMarks } = location.state || {};

  const goToHome = () => {
    navigate('/caseSelect');
  };

  if (!sectionResults) {
    // Reached directly (e.g. a page refresh loses React Router state)
    // rather than at the end of an exam -- nothing to show.
    return (
      <div className="feedback-container">
        <h2 className="feedback-heading">Feedback</h2>
        <p>No results to show yet. Complete a case's examination to see your score here.</p>
        <button onClick={goToHome} className="go-home-button">Go Back to Home</button>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <h2 className="feedback-heading">Feedback</h2>

      <div className="total-score">
        <strong>Exam Score: {examScore} / 100</strong>
      </div>
      {historyMarks !== null && historyMarks !== undefined && (
        <div>
          <strong>History Taking Marks: {historyMarks}</strong>
        </div>
      )}

      <table className="feedback-table">
        <thead>
          <tr>
            <th>Section</th>
            <th>Question</th>
            <th>Your Answer</th>
            <th>Correct Answer</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {sectionResults.map((section) =>
            section.details.map((q, index) => (
              <tr key={`${section.sectionName}-${index}`}>
                {index === 0 && (
                  <td rowSpan={section.details.length}>{section.sectionName}</td>
                )}
                <td>{q.question}</td>
                <td>{q.selected.join(', ') || '(no answer)'}</td>
                <td>{q.correct.join(', ')}</td>
                <td>{q.isCorrect ? 'Correct' : 'Incorrect'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="section-scores">
        <h4>Section Scores</h4>
        <ul>
          {sectionResults.map((section) => (
            <li key={section.sectionName}>
              {section.sectionName}: {section.correct} / {section.total}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={goToHome} className="go-home-button">Go Back to Home</button>
    </div>
  );
};

export default FeedbackEval;
