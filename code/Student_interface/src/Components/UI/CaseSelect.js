import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Grid, Paper, Container, Typography, Snackbar, Alert } from "@mui/material";
import img3 from "../../Images/newBack.jpg";
import Navbar from "../Navbar";
import CaseCard from "./caseSelect/CaseCard";
import { CaseActions } from "../../Actions/Case/CaseActions";
import BASE_URL from "../../config"; // Adjust the path as necessary

function CaseSelect() {
    const { userInfomation } = useSelector((state) => state.user);
    const { allCaseData } = useSelector((state) => state.caseSelected);

    const navigate = useNavigate();
    const location = useLocation();
    const [cases, setCase] = useState([]);
    const dispatch = useDispatch();

    // CaseDesc.js and ExaminationQuestionSections.js redirect back here (with
    // a `message`) when a page refresh mid-flow reset the in-memory case
    // selection -- surface that so it doesn't just look like an unexplained
    // bounce back to case selection.
    const [showResetNotice, setShowResetNotice] = useState(!!location.state?.message);
    const resetMessage = location.state?.message;

    const handleClick = () => {
        console.log("button clicked");
        navigate("/historyTaking");
    };

    useEffect(() => {
        fetchCase();
    }, []);

    const fetchCase = async () => {
        try {
            const response = await axios.get(`${BASE_URL}dentalComplaintCases/getAllCases`);
            const qArray = response.data;
            console.log(qArray);
            if (cases.length < qArray.length) {
                setCase(qArray);
                dispatch(CaseActions.setAllCases(qArray));
            }
        } catch (error) {
            console.error("Error fetching cases:", error);
        }
    };

    return (
        <div
            className="app"
            style={{
                backgroundImage: `url(${img3})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                marginTop: "0px",
            }}
        >
            <Navbar />
            <Container>
                <Typography variant="h3" component="div" align="center" color="white" gutterBottom marginTop={'20px'} marginBottom={'20px'}>
                    Case Selection
                </Typography>
                <Grid container spacing={3}>
                    {cases.map((object) => (
                        <Grid item xs={12} sm={6} md={4} key={object.caseId}>
                            <Paper elevation={3}>
                                <CaseCard caseSelectedInUI={object} />
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>
            <Snackbar
                open={showResetNotice}
                autoHideDuration={8000}
                onClose={() => setShowResetNotice(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setShowResetNotice(false)} severity="info" sx={{ width: '100%' }}>
                    {resetMessage}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default CaseSelect;
