import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Grid, Paper, Container, Typography, Snackbar, Alert, Skeleton, Box } from "@mui/material";
import img3 from "../../Images/newBack.jpg";
import Navbar from "../Navbar";
import CaseCard from "./caseSelect/CaseCard";
import { CaseActions } from "../../Actions/Case/CaseActions";
import BASE_URL from "../../config"; // Adjust the path as necessary

// How many placeholder cards to show while the real list is loading. Doesn't
// need to match the real count -- it's just filling the screen so it doesn't
// look broken/empty for the second or two the request takes.
const SKELETON_CARD_COUNT = 6;

function CaseSelect() {
    const { userInfomation } = useSelector((state) => state.user);
    const { allCaseData } = useSelector((state) => state.caseSelected);

    const navigate = useNavigate();
    const location = useLocation();
    const [cases, setCase] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
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
        setIsLoading(true);
        setLoadError(false);
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
            setLoadError(true);
        } finally {
            setIsLoading(false);
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
            <Container sx={{ paddingBottom: "40px" }}>
                <Typography variant="h3" component="div" align="center" color="white" gutterBottom marginTop={'20px'} marginBottom={'20px'}>
                    Case Selection
                </Typography>

                {isLoading && (
                    <Grid container spacing={3}>
                        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
                            <Grid item xs={12} sm={6} md={4} key={`case-skeleton-${index}`}>
                                <Paper elevation={3} sx={{ overflow: "hidden" }}>
                                    <Skeleton variant="rectangular" height={140} animation="wave" />
                                    <Box sx={{ padding: "16px" }}>
                                        <Skeleton variant="text" width="70%" height={32} animation="wave" />
                                        <Skeleton variant="text" width="100%" animation="wave" />
                                        <Skeleton variant="text" width="40%" animation="wave" />
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {!isLoading && loadError && (
                    <Alert severity="error" sx={{ maxWidth: "480px", margin: "0 auto" }}>
                        We couldn't load the case list. Please check your connection and refresh the page.
                    </Alert>
                )}

                {!isLoading && !loadError && cases.length === 0 && (
                    <Alert severity="info" sx={{ maxWidth: "480px", margin: "0 auto" }}>
                        No cases are available right now. Please check back later.
                    </Alert>
                )}

                {!isLoading && !loadError && cases.length > 0 && (
                    <Grid container spacing={3}>
                        {cases.map((object) => (
                            <Grid item xs={12} sm={6} md={4} key={object.caseId}>
                                <Paper elevation={3}>
                                    <CaseCard caseSelectedInUI={object} />
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
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
