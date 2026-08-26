const express = require("express");
const router = express.Router();
const fileParser = require("express-multipart-file-parser");
const bodyParser = require("body-parser");
const { Readable } = require("stream");
const moment = require("moment");

const COLLECTION_NAME = "dentalComplaintCases";

// Questions authored before `order` existed have no such field. Sort those
// after anything that DOES have one, and leave their relative order alone
// (Array.prototype.sort is stable) rather than dropping or misplacing them.
const sortByOrder = (questions) =>
  [...questions].sort((a, b) => {
    if (a.order == null && b.order == null) return 0;
    if (a.order == null) return 1;
    if (b.order == null) return -1;
    return a.order - b.order;
  });

const { admin, db, bucket } = require("../config/db");

// Middleware and route for creating an examination question
router.post(
  "/createExaminationQuestion",
  fileParser,
  bodyParser.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      // Check if required fields are present
      const {
        mainTypeName,
        complaintTypeName,
        caseId,
        sectionName,
        questionType,
        question,
        answerChoices,
      } = req.body;

      if (!mainTypeName || !complaintTypeName || !caseId || !sectionName) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      // Parse answer choices
      const answerChoicesInJson = JSON.parse(answerChoices);

      // Determine the type of question
      let caseQuestionType = null;
      if (questionType === "single") {
        caseQuestionType =
          req.files.length === 0
            ? "multipleChoiceType"
            : req.files.length === 1
            ? "multipleChoiceTypeWithQuestionImage"
            : "multipleChoiceTypeWithImages";
      } else if (questionType === "multiple") {
        caseQuestionType =
          req.files.length === 0
            ? "multipleAnswerType"
            : req.files.length === 1
            ? "multipleAnswerTypeWithQuestionImage"
            : "multipleAnswerTypeWithImages";
      }

      // Reference to Firestore collection
      const complaintTypeRef = db
        .collection(COLLECTION_NAME)
        .doc(mainTypeName)
        .collection(complaintTypeName)
        .doc(caseId)
        .collection(sectionName);

      let newQuestionRef = null;
      let choices = [];
      let questionImageUrl = null;
      let i = 0;

      // Function to upload files to Firebase Storage
      const uploadFile = async (file) => {
        const fileStream = Readable.from(file.buffer);
        const currentDateTime = moment().format("YYYYMMDD_HHmmss");
        const fileUpload = bucket.file(
          `Images/${currentDateTime}_${file.originalname}`
        );
        const writeStream = fileUpload.createWriteStream({
          metadata: { contentType: file.mimetype },
        });

        await new Promise((resolve, reject) => {
          fileStream
            .pipe(writeStream)
            .on("error", reject)
            .on("finish", resolve);
        });

        const downloadURL = await fileUpload.getSignedUrl({
          action: "read",
          expires: "12-31-9999",
        });
        return downloadURL[0];
      };

      // Process files and construct choices
      if (
        [
          "multipleChoiceTypeWithImages",
          "multipleAnswerTypeWithImages",
        ].includes(caseQuestionType)
      ) {
        for (const file of req.files) {
          const downloadURL = await uploadFile(file);

          if (file.fieldname === "QuestionImage") {
            questionImageUrl = downloadURL;
          } else {
            choices.push({
              text: answerChoicesInJson.answerChoices[i].text,
              choiceId: file.fieldname,
              imageUrl: downloadURL,
              isCorrect: answerChoicesInJson.answerChoices[i].isCorrect,
            });
            i++;
          }
        }

        if (!questionImageUrl) {
          caseQuestionType = caseQuestionType.replace(
            "WithImages",
            "WithAnswerImage"
          );
        } else {
          caseQuestionType = caseQuestionType.replace(
            "WithImages",
            "WithQuestionAndAnswerImage"
          );
        }
      } else if (
        [
          "multipleChoiceTypeWithQuestionImage",
          "multipleAnswerTypeWithQuestionImage",
        ].includes(caseQuestionType)
      ) {
        questionImageUrl = await uploadFile(req.files[0]);
      }

      // New questions go at the end of the section by default. `order` is
      // what getAllExaminationQuestions*/updateQuestionsOrder below sort
      // and rewrite -- see updateQuestionsOrder for how a tutor reorders
      // questions after the fact.
      const existingQuestionsSnapshot = await complaintTypeRef.get();
      const nextOrder = existingQuestionsSnapshot.size;

      // Add question to Firestore
      newQuestionRef = await complaintTypeRef.add({
        Question: {
          questionType: caseQuestionType,
          question: question,
          choices: choices.length ? choices : answerChoicesInJson,
          questionImageUrl: questionImageUrl || null,
          order: nextOrder,
        },
      });

      // Respond with success
      res.status(201).json({
        message: "Question uploaded successfully.",
        mainComplaintType: mainTypeName,
        caseName: complaintTypeName,
        caseId: caseId,
        questionId: newQuestionRef.id,
        questionType: questionType,
        questionImageUrl: questionImageUrl,
        choices: choices.length ? choices : answerChoicesInJson,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Updates an existing question's text, answer choices, and/or images in
// place. Added to fix questions that were saved incomplete (e.g. answer
// choices with blank text and no correct answer marked, or the wrong image
// attached) -- there was previously no way to correct a question once
// created, only add a new one alongside it.
//
// Images can only be REMOVED here, not replaced/re-uploaded -- that still
// needs a new question, since it requires a file upload. Removing just
// clears the stored URL; the file itself is left in Firebase Storage (it's
// unlinked, not deleted, since other questions could in principle reuse the
// same URL and deleting the wrong thing is worse than leaving an orphan
// file behind).
//
// Body: { mainTypeName, complaintTypeName, caseId, sectionName, questionId,
//         question, removeQuestionImage?,
//         answerChoices: [{ text, isCorrect, removeImage? }, ...] }
router.put(
  "/updateExaminationQuestion",
  bodyParser.json(),
  async (req, res) => {
    try {
      const {
        mainTypeName,
        complaintTypeName,
        caseId,
        sectionName,
        questionId,
        question,
        answerChoices,
        removeQuestionImage,
      } = req.body;

      if (
        !mainTypeName ||
        !complaintTypeName ||
        !caseId ||
        !sectionName ||
        !questionId
      ) {
        return res.status(400).json({
          error:
            "Missing identifiers. Supply mainTypeName, complaintTypeName, caseId, sectionName and questionId.",
        });
      }

      const questionRef = db
        .collection(COLLECTION_NAME)
        .doc(mainTypeName)
        .collection(complaintTypeName)
        .doc(caseId)
        .collection(sectionName)
        .doc(questionId);

      const existing = await questionRef.get();
      if (!existing.exists) {
        return res.status(404).json({ error: "No such question." });
      }

      const existingQuestion = existing.data().Question || {};
      const updatedQuestion = { ...existingQuestion };

      if (typeof question === "string" && question.length > 0) {
        updatedQuestion.question = question;
      }

      if (removeQuestionImage) {
        updatedQuestion.questionImageUrl = null;
      }

      if (Array.isArray(answerChoices)) {
        // Preserve whichever shape this question already used (a plain
        // array for per-choice images, or {answerChoices: [...]} otherwise)
        // -- see createExaminationQuestion above for why there are two.
        if (Array.isArray(existingQuestion.choices)) {
          updatedQuestion.choices = existingQuestion.choices.map(
            (choice, idx) => ({
              ...choice,
              text: answerChoices[idx]?.text ?? choice.text,
              isCorrect: answerChoices[idx]?.isCorrect ?? choice.isCorrect,
              imageUrl: answerChoices[idx]?.removeImage
                ? null
                : choice.imageUrl,
            })
          );
        } else {
          updatedQuestion.choices = { answerChoices };
        }
      }

      await questionRef.update({ Question: updatedQuestion });

      res.status(200).json({
        message: "Question updated successfully.",
        questionId,
        Question: updatedQuestion,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Lets a tutor reorder every question in one section in a single call --
// pass the FULL list of that section's question ids in the order they
// should appear. Each doc's Question.order is rewritten to match its index.
// A partial list would leave the missing questions' old order values in
// place, which could put them anywhere relative to the reordered ones, so
// the caller (ManageQuestions.jsx) always sends the whole section.
//
// Body: { mainTypeName, complaintTypeName, caseId, sectionName,
//         orderedQuestionIds: [questionId, ...] }
router.put("/updateQuestionsOrder", bodyParser.json(), async (req, res) => {
  try {
    const {
      mainTypeName,
      complaintTypeName,
      caseId,
      sectionName,
      orderedQuestionIds,
    } = req.body;

    if (
      !mainTypeName ||
      !complaintTypeName ||
      !caseId ||
      !sectionName ||
      !Array.isArray(orderedQuestionIds) ||
      orderedQuestionIds.length === 0
    ) {
      return res.status(400).json({
        error:
          "Missing identifiers or orderedQuestionIds. Supply mainTypeName, complaintTypeName, caseId, sectionName and a non-empty orderedQuestionIds array.",
      });
    }

    const sectionRef = db
      .collection(COLLECTION_NAME)
      .doc(mainTypeName)
      .collection(complaintTypeName)
      .doc(caseId)
      .collection(sectionName);

    const batch = db.batch();
    orderedQuestionIds.forEach((questionId, index) => {
      batch.update(sectionRef.doc(questionId), { "Question.order": index });
    });
    await batch.commit();

    res.status(200).json({
      message: "Question order updated.",
      orderedQuestionIds,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get all questions
router.get("/getAllExaminationQuestionsBySectionName", async (req, res) => {
  try {
    console.log(req.query);
    const { mainTypeName, complaintTypeName, caseId, sectionName } = req.query;

    const complaintTypeRef = db
      .collection(COLLECTION_NAME)
      .doc(mainTypeName)
      .collection(complaintTypeName)
      .doc(caseId)
      .collection(sectionName);

    // Get questions sorted by document ID
    const questions = [];
    const snapshot = await complaintTypeRef
      .orderBy(admin.firestore.FieldPath.documentId())
      .get();
    snapshot.forEach((doc) => {
      // A doc with no `Question` field (or a malformed one) used to throw
      // here and take the WHOLE request down with a 500 -- one bad question
      // meant the tutor couldn't see any of this section's other questions
      // either. Skip just that doc instead, and still return the rest.
      const data = doc.data();
      if (!data || !data.Question) {
        console.warn(
          `Skipping malformed question doc ${doc.id} in ${mainTypeName}/${complaintTypeName}/${caseId}/${sectionName}`
        );
        return;
      }
      questions.push({
        questionId: doc.id,
        question: data.Question.question,
        questionType: data.Question.questionType,
        questionImageUrl: data.Question.questionImageUrl,
        choices: data.Question.choices,
        order: data.Question.order,
      });
    });

    res.status(200).json({
      message: "Questions retrieved successfully.",
      data: sortByOrder(questions),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all questions by section name
router.get("/getAllExaminationQuestions", async (req, res) => {
  try {
    console.log(req.query);
    const { mainTypeName, complaintTypeName, caseId } = req.query;

    const caseRef = db
      .collection(COLLECTION_NAME)
      .doc(mainTypeName)
      .collection(complaintTypeName)
      .doc(caseId);

    // Retrieve all sections within the case
    const sectionsSnapshot = await caseRef.listCollections();
    const questionsBySections = {};

    for (const section of sectionsSnapshot) {
      if (section.id === "toothDetails") {
        continue;
      }
      const sectionName = section.id;
      const questions = [];
      const questionsSnapshot = await section
        .orderBy(admin.firestore.FieldPath.documentId())
        .get();

      questionsSnapshot.forEach((doc) => {
        // Same defensive skip as getAllExaminationQuestionsBySectionName
        // above -- one malformed doc in one section shouldn't 500 the
        // whole case's question list.
        const data = doc.data();
        if (!data || !data.Question) {
          console.warn(
            `Skipping malformed question doc ${doc.id} in ${mainTypeName}/${complaintTypeName}/${caseId}/${sectionName}`
          );
          return;
        }
        questions.push({
          questionId: doc.id,
          question: data.Question.question,
          questionType: data.Question.questionType,
          questionImageUrl: data.Question.questionImageUrl,
          choices: data.Question.choices,
          order: data.Question.order,
        });
      });

      questionsBySections[sectionName] = sortByOrder(questions);
    }

    res.status(200).json({
      message: "Questions retrieved successfully.",
      data: questionsBySections,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
