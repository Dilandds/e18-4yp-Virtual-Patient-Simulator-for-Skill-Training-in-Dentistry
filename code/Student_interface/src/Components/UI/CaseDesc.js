import React, { useContext, useEffect, useState, useRef } from "react";
import axios from 'axios';
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Grid } from "@mui/material";
import img2 from "../../Images/bkk.jpg";
import Navbar from "../Navbar";
import { CaseDataContext } from '../../CaseDataContext';
import BASE_URL from '../../config'; // Adjust the path as necessary

import Instructions from "../Instructions";
import Dropdowns from "../Dropdowns";
import SectionTitle from "../SectionTitle";
import Conversation from "../Conversation";
import NavigationButtons from '../NavigationButtons';
import imagedoc from "../../Images/doc.gif";
import imagepet from "../../Images/pat.gif";
import {CaseContext} from "../../context/CaseContext";


const CaseDesc = () => {
    const { setCaseData } = useContext(CaseDataContext);
    const [selectedQId, setSelectedQId] = useState([]);
    const { userInfomation } = useSelector((state) => state.user);
    const { sectionOrder } = useSelector((state) => state.historyQ);
    const { selectedQdata } = useSelector((state) => state.historyQ);
    const { selectedCaseDetails } = useContext(CaseContext);
    const { isSubmitDiagnosis } = useSelector((state) => state.diagnosisQ);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [qId, setIdOfQ] = useState("");
    const [value, setValue] = useState("");
    const [Section, setSection] = useState("");
    const [ans, setAns] = useState("");
    const [selectedSection, setSelectedSection] = useState(null);
    // Keys must match the category names the tutor actually authors under
    // (Tutor_interface/src/pages/historyQuestions/HistoryQuestions.jsx's
    // `initialSections`) -- this used to say 'Smoking and drinking habits'
    // while the tutor side saves that category as 'Habits', so picking
    // "Habits" from the section dropdown below always looked up a key that
    // didn't exist in the fetched data and silently showed zero questions.
    // (This default only matters until the fetch below replaces it wholesale
    // with whatever the API returns, but it's what a student sees briefly
    // and what handleSection falls back to if a category has no questions.)
    const [questions, setQuestions] = useState({
        'General Questions': [],
        'Medical History': [],
        'Habits': [],
        'Dietary history': [],
        'Others': []
    });
    const [questionsForDropdown, setQuestionsForDropdown] = useState([]);
    const [selectedQ, setSelectedQ] = useState([]);
    const [selectedQIds, setSelectedQIds] = useState([]);
    const endOfContentRef = useRef(null);

    const fetchQuestions = async (caseDetails) => {
        try {
            console.log("case details history taking",caseDetails)
            const response = await axios.post(`${BASE_URL}dentalComplaintCases/getCaseHistoryTakingQuestions`, {
                caseId: caseDetails.caseId,
                mainComplaintType: caseDetails.mainComplaintType,
                caseName: caseDetails.caseName,
            });
            console.log("history taking fetched data",response)
            return response.data;
        } catch (error) {
            console.error('Error fetching questions:', error);
            throw error;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await fetchQuestions(selectedCaseDetails);
                setQuestions(data);
            } catch (error) {
                console.error('Failed to fetch questions:', error);
            }
        };

        fetchData();
    }, [selectedCaseDetails]);

    const handleSection = (eventKey) => {
        setSelectedSection(eventKey);
        const filteredQuestions = (questions[eventKey] || []).map((item, index) => ({
            id: index,
            q: item.questionText,
            a: item.answer,
            required: item.required
        }));
        setQuestionsForDropdown(filteredQuestions);
    };

    const handleSelect = (eventKey) => {
        const selectedQuestion = questionsForDropdown.find((q) => q.id === parseInt(eventKey));
        setSelectedQ((prevSelectedQ) => [...prevSelectedQ, selectedQuestion]);
        setSelectedQIds((prevSelectedQIds) => [...prevSelectedQIds, selectedQuestion.id]);
    };

    const handleClick = () => {
        // Award marks per SELECTED QUESTION, using the `required` flag each
        // question already carries from the section it was picked from
        // (see handleSection/handleSelect above).
        //
        // This used to be recomputed here from `selectedQIds` by looking up
        // `questions[category][index]` for every category, matching purely
        // by array index with no idea which category the id actually came
        // from -- so a question at index 2 in one section could get scored
        // using a same-index question from a completely different section.
        // `selectedQ` already has the right question (and its `required`
        // flag) attached at selection time, so use that directly instead.
        let totalMarks = 0;
        selectedQ.forEach((question) => {
            if (question && question.required !== undefined) {
                totalMarks += question.required ? 10 : -5;
            }
        });

        // For the feedback page: every question that was either relevant
        // (tutor marked it required) or that the student actually asked,
        // so the feedback page can show "expected" next to "what you
        // chose" instead of just a bare mark total. Matched by question
        // text rather than id, since `id` is only unique WITHIN a
        // category (it's just that category's array index) -- the same
        // reason the marks calculation above no longer uses ids either.
        const selectedTexts = new Set(selectedQ.map((q) => q.q));
        const historyDetails = [];
        Object.entries(questions).forEach(([category, categoryQuestions]) => {
            (categoryQuestions || []).forEach((q) => {
                const asked = selectedTexts.has(q.questionText);
                if (q.required || asked) {
                    historyDetails.push({
                        category,
                        question: q.questionText,
                        expected: !!q.required,
                        asked,
                    });
                }
            });
        });

        console.log("Total Marks:", totalMarks);
        window.scrollTo({ top: 0, behavior: "smooth" });

        setTimeout(() => {
            navigate("/page4");
        }, 500);

        setCaseData(previousData => ({ ...previousData, totalMarks, historyDetails }));
    };

    const handleClick1 = () => {
        navigate("/caseSelect");
    };

    useEffect(() => {
        endOfContentRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedQ]);

    // selectedCaseDetails only ever lives in memory (see context/CaseContext.js
    // -- it's a plain useState, nothing writes it to localStorage/sessionStorage).
    // A hard refresh remounts the whole app and resets it to null even though
    // the student is still signed in (Redux's isSignIn survives refresh via
    // redux-persist, so PrivateRoute lets them straight through to this page
    // anyway). Without this guard, `selectedCaseDetails.caseName` below throws
    // trying to read a property off null, which is the "refresh breaks the UI"
    // bug -- send them back to pick the case again instead of crashing.
    useEffect(() => {
        if (!selectedCaseDetails) {
            navigate("/caseSelect", {
                replace: true,
                state: { message: "Your case was reset by the page refresh. Please select it again to continue." },
            });
        }
    }, [selectedCaseDetails, navigate]);

    if (!selectedCaseDetails) {
        return null;
    }

    return (
        <div
            className="app"
            style={{
                backgroundImage: `url(${img2})`,
                minHeight: "100vh",
                fontSize: "50px",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                overflowX: "hidden"
            }}
        >
            <div className="navText">
                <Navbar />
            </div>
            <div></div>
            <div className="phtopic1">Patient History Taking</div>
            <div className="phtopic2">{selectedCaseDetails.caseName}: {selectedCaseDetails.caseScenario}</div>
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <hr style={{ borderTop: '3px solid #bbb' }} />
            </div>
            <Grid container spacing={0}>
                <Grid item xs={4}>
                    <Instructions />
                    <Dropdowns
                        handleSection={handleSection}
                        handleSelect={handleSelect}
                        questionsForDropdown={questionsForDropdown}
                        selectedCaseDetails={selectedCaseDetails}
                        selectedSection={selectedSection}
                    />
                    <SectionTitle Section={Section} />
                </Grid>
                <Grid item xs={8}>
                    <Grid container>
                        <Grid item xs={0.5}>
                            <img
                                className="docimage"
                                src={imagedoc}
                                style={{ width: "200px", height: "200px", marginLeft: "-125px" }}
                                alt="Doctor gif"
                            />
                        </Grid>
                        <Grid item xs={11}>
                            <div className="phqna">
                                <Conversation selectedQ={selectedQ} endOfContentRef={endOfContentRef} />
                            </div>
                        </Grid>
                        <Grid item xs={0.5}>
                            <img
                                className="petimage"
                                src={imagepet}
                                style={{ width: "200px", height: "200px" }}
                                alt="patient gif"
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <NavigationButtons handleClick1={handleClick1} handleClick={handleClick} isSubmitDiagnosis={isSubmitDiagnosis} />
        </div>
    );
};

export default CaseDesc;
