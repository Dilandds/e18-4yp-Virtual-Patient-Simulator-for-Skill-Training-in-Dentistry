const { db, bucket } = require("../config/db");
const express = require("express");
const router = express.Router();

const COLLECTION_NAME = "3dModel";

// DEPRECATED — do not call from new code.
//
// This records "the active case" in a single global document
// (3dModel/caseDetails) shared by every user of the platform. It was how the
// Student interface told the backend which case the Unity player should
// render, because Unity's compiled-in request URL carried no identifiers.
//
// With more than one student active, each selection overwrote the previous
// one, so a student could silently be shown another student's case. The
// Student interface no longer calls this; it passes the identifiers on the
// request instead. Kept only so any older deployed client keeps functioning.
router.put("/store", async (req, res) => {
  try {
    // Extract case data from the request body
    const { mainTypeName, complaintTypeName, caseId } = req.body;

    // Reference to the specific document in the Firestore collection
    const complaintTypeRef = db.collection(COLLECTION_NAME).doc("caseDetails");

    // Update the document with new details
    await complaintTypeRef.update({
      mainTypeName: mainTypeName,
      complaintTypeName: complaintTypeName,
      caseId: caseId,
    });

    res.status(200).send({ message: "Tooth details updated successfully." });
  } catch (error) {
    console.error("Error updating tooth details:", error);
    res.status(500).send({
      message: "Failed to update tooth details.",
      error: error.message,
    });
  }
});
// Route to get tooth details from Firestore.
//
// PREFERRED: the caller supplies caseId / mainTypeName / complaintTypeName as
// query parameters, so the request is self-contained and two students can be
// served different cases at the same time.
//
// The Unity WebGL build has its request URL compiled in without parameters,
// so the Student interface appends them in the browser before the request is
// sent (see Student_interface/src/unityCaseRequestInterceptor.js).
//
// LEGACY FALLBACK: if no parameters are supplied, fall back to the old
// behaviour of reading the shared 3dModel/caseDetails document. That document
// is GLOBAL — every student overwrote it on case selection, so under
// concurrent use it returned whichever case was selected most recently by
// ANY student, not the case the requesting student had chosen. The fallback
// is kept only so older clients do not break outright; it must not be relied
// on, and should be deleted once the Unity project is rebuilt with the
// parameters in its request URL.
router.get("/get", async (req, res) => {
  try {
    let { mainTypeName, complaintTypeName, caseId } = req.query;

    if (mainTypeName && complaintTypeName && caseId) {
      console.log("caseTeeth/get (scoped):", {
        mainTypeName,
        complaintTypeName,
        caseId,
      });
    } else {
      console.warn(
        "caseTeeth/get called WITHOUT case parameters; " +
          "falling back to the shared 3dModel/caseDetails pointer. " +
          "This is not concurrency-safe."
      );

      const complaintTypereference = db
        .collection(COLLECTION_NAME)
        .doc("caseDetails");

      const document = await complaintTypereference.get();

      if (!document.exists) {
        return res.status(404).json({ error: "No such document!" });
      }

      ({ mainTypeName, complaintTypeName, caseId } = document.data());
    }

    if (!mainTypeName || !complaintTypeName || !caseId) {
      return res.status(400).json({
        error:
          "Missing case identifiers. Supply caseId, mainTypeName and " +
          "complaintTypeName as query parameters.",
      });
    }

    // Reference to the document
    const complaintTypeRef = db
      .collection("dentalComplaintCases")
      .doc(mainTypeName)
      .collection(complaintTypeName)
      .doc(caseId)
      .collection("toothDetails")
      .doc("teeth");

    // Retrieve the document
    const doc = await complaintTypeRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "No such document!",
        detail: `No toothDetails/teeth for case ${caseId}.`,
      });
    }

    // Send back the document data
    res.status(200).json({
      message: "Tooth details retrieved successfully.",
      data: doc.data(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
