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
            // Keyed by position ("choice-0", "choice-1", ...), NOT by the
            // choice's own text. Image-only answer choices (e.g. "select
            // the diagram which denotes code 3") are saved with blank
            // text, and object keys must be unique -- keying by text meant
            // every blank-text choice overwrote the last one, so only the
            // final image-only choice ever survived into `answers` and the
            // other three silently vanished (and grading compared against
            // whichever one happened to survive, not necessarily the
            // tutor-marked correct one). See CheckboxQuestion.js for the
            // matching render-side fix.
            answers: choices.reduce((acc, choice, idx) => {
              acc[`choice-${idx}`] = {
                text: choice.text || "",
                imageUrl: choice.imageUrl || null,
                isCorrect: !!choice.isCorrect,
                isChecked: false,
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
    (choiceKey) => {
      setQuestions((prev) =>
        prev.map((q, idx) => {
          if (idx !== currentIndex) return q;
          const nextAnswers = { ...q.answers };
          if (q.isMultiAnswer) {
            nextAnswers[choiceKey] = {
              ...nextAnswers[choiceKey],
              isChecked: !nextAnswers[choiceKey].isChecked,
            };
          } else {
            Object.keys(nextAnswers).forEach((key) => {
              nextAnswers[key] = {
                ...nextAnswers[key],
                isChecked: key === choiceKey,
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

      // Still fetching -- ignore a click that landed before we know whether
      // this section has questions, rather than misreading the in-flight
      // empty array as "this section genuinely has none."
      if (loading) return;

      // A section can genuinely have zero questions if the tutor hasn't
      // authored any for it yet (e.g. a case still being built). Previously
      // this fell through to `if (!q) return` below, so clicking SUBMIT
      // silently did nothing -- the student was stuck on a blank screen
      // with no way to move past it. Treat "nothing to answer" as an
      // automatic pass-through instead: complete the section with zero
      // questions/zero score so the rest of the exam is still reachable.
      if (questions.length === 0) {
        if (onComplete) {
          onComplete({ sectionName, total: 0, correct: 0, details: [] });
        }
        return;
      }

      const q = questions[currentIndex];
      if (!q) return;

      const entries = Object.entries(q.answers);
      const selectedKeys = entries.filter(([, v]) => v.isChecked).map(([key]) => key);
      const correctKeys = entries.filter(([, v]) => v.isCorrect).map(([key]) => key);
      const selectedSet = [...selectedKeys].sort().join("|");
      const correctSet = [...correctKeys].sort().join("|");
      const isCorrect = selectedKeys.length > 0 && selectedSet === correctSet;

      // Text is only for the results log below (e.g. a future review
      // screen) -- grading above already happened on the stable keys, so a
      // blank label on an image-only choice can't affect the score.
      const labelFor = (key) => q.answers[key].text || "(image option)";
      const record = {
        question: q.question,
        selected: selectedKeys.map(labelFor),
        correct: correctKeys.map(labelFor),
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
    [loading, questions, currentIndex, results, onComplete, sectionName]
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
