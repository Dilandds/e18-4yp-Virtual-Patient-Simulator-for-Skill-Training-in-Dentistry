import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { StepContext } from "../../context/StepContext";
import { CaseContext } from "../../context/CaseContext";
import { CaseDataContext } from "../../CaseDataContext";
import BASE_URL from "../../config";
import PeriodontalScreening from "./Steps/PeriodontalScreening";
import SoftTissueAssessment from "./Steps/SoftTissueAssessment";
import HardTissueAssessment from "./Steps/HardTissueAssessment";
import Investigations from "./Steps/Investigations";
import Radiographs from "./Steps/Radiographs";
import SensibilityRecordings from "./Steps/SensibilityRecordings";
import HematologicalRecordings from "./Steps/HematologicalRecordings";
import Diagnosis from "./Steps/Diagnosis";
import DentalChart from "../Dental Charts/DentalChart";
import OtherCharts from "./Steps/OtherCharts";

// One entry per section rendered below (same order as the section === N
// checks), used only to know when we've reached the last one.
const SECTION_COUNT = 10;

const ExaminationQuestionSections = () => {
    const { step, incrementStep } = useContext(StepContext);
    const { selectedCaseDetails } = useContext(CaseContext);
    const { caseData } = useContext(CaseDataContext);
    const { userInfomation } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [section, setSection] = useState(0);
    const [sectionResults, setSectionResults] = useState([]);

    useEffect(() => {
        setSection(step);
    }, [step]);

    // Combines every graded section's score into one result, saves it, and
    // sends the student to the feedback page. DentalChart currently has no
    // scoring of its own (see DentalChart.js), so it isn't part of the exam
    // score below -- it's still shown to the student, it just doesn't grade.
    const finishExam = async (results) => {
        const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);
        const totalQuestions = results.reduce((sum, r) => sum + r.total, 0);
        const examScore =
            totalQuestions > 0
                ? Math.round((totalCorrect / totalQuestions) * 100)
                : 0;
        // History-taking relevance marks, if that page was completed this
        // session (see CaseDesc.js). Not required -- a student can reach the
        // exam directly in some flows, so this may be absent.
        const historyMarks =
            typeof caseData?.totalMarks === "number" ? caseData.totalMarks : null;

        const payload = {
            caseId: selectedCaseDetails?.caseId,
            mainTypeName: selectedCaseDetails?.mainComplaintType,
            complaintTypeName: selectedCaseDetails?.caseName,
            studentId: userInfomation?.uid || userInfomation?.email || "unknown",
            sectionResults: results,
            examScore,
            historyMarks,
        };

        try {
            await axios.post(`${BASE_URL}examResults/submit`, payload);
        } catch (error) {
            // Don't block the student from seeing their own results just
            // because the save failed -- log it and carry on.
            console.error("Could not save exam results:", error);
        }

        navigate('/feedback', {
            state: { sectionResults: results, examScore, historyMarks },
        });
    };

    // Each graded Steps/*.js component calls onComplete(result) with its own
    // score; DentalChart still calls onComplete() with no argument, which is
    // treated as "nothing to grade" rather than forced into a score.
    const handleSectionComplete = (result) => {
        const updated = result ? [...sectionResults, result] : sectionResults;
        if (result) setSectionResults(updated);

        if (step + 1 >= SECTION_COUNT) {
            finishExam(updated);
        } else {
            incrementStep(step + 1);
        }
    };

    return (
        <div>
            {section === 0 ? (
                <PeriodontalScreening onComplete={handleSectionComplete} />
            ) : section === 1 ? (
                <SoftTissueAssessment onComplete={handleSectionComplete} />
            ) : section === 2 ? (
                <HardTissueAssessment onComplete={handleSectionComplete} />
            ) : section === 3 ? (
                <DentalChart onComplete={handleSectionComplete} />
            ) : section === 4 ? (
                <OtherCharts onComplete={handleSectionComplete} />
            ) : section === 5 ? (
                <Investigations onComplete={handleSectionComplete} />
            ) : section === 6 ? (
                <Radiographs onComplete={handleSectionComplete} />
            ) : section === 7 ? (
                <SensibilityRecordings onComplete={handleSectionComplete} />
            ) : section === 8 ? (
                <HematologicalRecordings onComplete={handleSectionComplete} />
            ) : section === 9 ? (
                <Diagnosis onComplete={handleSectionComplete} />
            ) : null}
        </div>
    );
};

export default ExaminationQuestionSections;
