import { useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import BASE_URL from "../../config";
import { CaseContext } from "../../context/CaseContext";

/**
 * Fetches one exam section's tutor-authored questions, lets the student pick
 * an answer, and grades each question against the tutor's `isCorrect` flags
 * when the student submits.
 *
 * Deliberately simple, on purpose:
 *  - one point per question, no partial credit for multi-answer questions
 *    (the selected set must exactly match the tutor's correct set)
 *  - no retry-attempt limit and no positive/negative marking scheme
 *  - a question with no tutor-marked correct answer at all just can't be
 *    scored right (isCorrect stays false), rather than throwing
 *
 * This is the minimum needed to make "tutor asks -> student answers -> gets
 * marked" actually work end-to-end. All nine Steps/*.js components were
 * previously near-identical copies of this same fetch/state/submit logic,
 * just with a different sectionName and title, and none of them kept the
 * `isCorrect` field or captured an answer at all -- see useExamSection call
 * sites for what each one now looks like.
 */
export function useExamSection(sectionName, onComplete) {
  const { selectedCaseDetails } = useContext(CaseContext);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const url =
          `${BASE_URL}examintionQuestions/getAllExaminationQuestionsBySectionName` +
          `?mainTypeName=${selectedCaseDetails.mainComplaintType}` +
          `&complaintTypeName=${selectedCaseDetails.caseName}` +
          `&caseId=${selectedCaseDetails.caseId}` +
          `&sectionName=${sectionName}`;
        const response = await axios.get(url);
        const data = (response.data.data || []).map((item) => {
          // The backend stores `choices` two different ways depending on how
          // the question was authored: a plain array when the tutor uploaded
          // a separate image per answer choice, or {answerChoices: [...]}
          // when it didn't (see examinationQuestionsRoutes.js's
          // createExaminationQuestion). Only the second shape used to be
          // read here, so any question with per-choice images silently
          // rendered zero answer choices -- e.g. "Select the diagram which
          // denotes code 3" in the Periodontal section.
          const rawChoices = item.choices;
          const choices = Array.isArray(rawChoices)
            ? rawChoices
            : rawChoices?.answerChoices || [];
          const isMultiAnswer = (item.questionType || "")
            .toLowerCase()
            .includes("multipleanswer");
          return {
            question: item.question,
            questionImageUrl: item.questionImageUrl || null,
            isMultiAnswer,
            correctAnswers: choices
              .filter((choice) => choice.isCorrect)
              .map((choice) => choice.text),
            answers: choices.reduce((acc, choice) => {
              acc[choice.text] = {
                isChecked: false,
                imageUrl: choice.imageUrl || null,
              };
              return acc;
            }, {}),
          };
        });
        if (!cancelled) {
          setQuestions(data);
          setCurrentIndex(0);
          setResults([]);
        }
      } catch (error) {
        console.error(`Error fetching questions for ${sectionName}:`, error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (selectedCaseDetails?.caseId) {
      fetchQuestions();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionName, selectedCaseDetails?.caseId]);

  /** Toggle a choice for the CURRENT question. Radios clear other choices. */
  const toggleAnswer = useCallback(
    (choiceText) => {
      setQuestions((prev) =>
        prev.map((q, idx) => {
          if (idx !== currentIndex) return q;
          const nextAnswers = { ...q.answers };
          if (q.isMultiAnswer) {
            nextAnswers[choiceText] = {
              ...nextAnswers[choiceText],
              isChecked: !nextAnswers[choiceText].isChecked,
            };
          } else {
            Object.keys(nextAnswers).forEach((text) => {
              nextAnswers[text] = {
                ...nextAnswers[text],
                isChecked: text === choiceText,
              };
            });
          }
          return { ...q, answers: nextAnswers };
        })
      );
    },
    [currentIndex]
  );

  const handleSubmit = useCallback(
    (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const q = questions[currentIndex];
      if (!q) return;

      const selected = Object.entries(q.answers)
        .filter(([, v]) => v.isChecked)
        .map(([text]) => text);
      const correctSet = [...q.correctAnswers].sort().join("|");
      const selectedSet = [...selected].sort().join("|");
      const isCorrect = selected.length > 0 && selectedSet === correctSet;

      const record = {
        question: q.question,
        selected,
        correct: q.correctAnswers,
        isCorrect,
      };
      const nextResults = [...results, record];
      setResults(nextResults);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        const correctCount = nextResults.filter((r) => r.isCorrect).length;
        if (onComplete) {
          onComplete({
            sectionName,
            total: nextResults.length,
            correct: correctCount,
            details: nextResults,
          });
        }
      }
    },
    [questions, currentIndex, results, onComplete, sectionName]
  );

  return {
    loading,
    currentQuestion: questions[currentIndex] || null,
    questionNumber: currentIndex + 1,
    questionCount: questions.length,
    toggleAnswer,
    handleSubmit,
  };
}
