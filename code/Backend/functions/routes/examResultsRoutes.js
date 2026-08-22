const express = require("express");
const router = express.Router();
const { db } = require("../config/db");

const COLLECTION_NAME = "dentalComplaintCases";

// Saves a student's finished exam result, scoped to that student and that
// case (dentalComplaintCases/{main}/{complaint}/{caseId}/studentResults/{uid}),
// not a shared document -- each student writes only their own doc, so this
// doesn't reintroduce the same everyone-shares-one-document problem that
// 3dModel/caseDetails had (see caseTeethRoutes.js).
router.post("/submit", async (req, res) => {
  try {
    const {
      caseId,
      mainTypeName,
      complaintTypeName,
      studentId,
      sectionResults,
      examScore,
      historyMarks,
      historyDetails,
    } = req.body;

    if (!caseId || !mainTypeName || !complaintTypeName || !studentId) {
      return res.status(400).json({
        error:
          "Missing identifiers. Supply caseId, mainTypeName, complaintTypeName and studentId.",
      });
    }

    const resultRef = db
      .collection(COLLECTION_NAME)
      .doc(mainTypeName)
      .collection(complaintTypeName)
      .doc(caseId)
      .collection("studentResults")
      .doc(studentId);

    await resultRef.set(
      {
        sectionResults: sectionResults || [],
        examScore: examScore ?? null,
        historyMarks: historyMarks ?? null,
        historyDetails: historyDetails || null,
        submittedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    res.status(200).json({ message: "Exam result saved successfully." });
  } catch (error) {
    console.error("Error saving exam result:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetches a single student's saved result for a case -- not wired up to any
// screen yet, kept here so a tutor-facing results view can be built later
// without another backend round-trip.
router.get("/get", async (req, res) => {
  try {
    const { caseId, mainTypeName, complaintTypeName, studentId } = req.query;

    if (!caseId || !mainTypeName || !complaintTypeName || !studentId) {
      return res.status(400).json({
        error:
          "Missing identifiers. Supply caseId, mainTypeName, complaintTypeName and studentId.",
      });
    }

    const resultRef = db
      .collection(COLLECTION_NAME)
      .doc(mainTypeName)
      .collection(complaintTypeName)
      .doc(caseId)
      .collection("studentResults")
      .doc(studentId);

    const doc = await resultRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "No saved result for this student and case." });
    }

    res.status(200).json({
      message: "Exam result retrieved successfully.",
      data: doc.data(),
    });
  } catch (error) {
    console.error("Error fetching exam result:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
