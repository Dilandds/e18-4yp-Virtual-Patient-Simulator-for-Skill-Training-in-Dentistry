import React, { useContext } from 'react';
import { Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CaseContext } from '../../../context/CaseContext'
import { setActiveCase } from "../../../unityCaseRequestInterceptor";

const CaseCard = ({ caseSelectedInUI }) => {
    const { setSelectedCaseDetails } = useContext(CaseContext);
    const navigate = useNavigate();

    const handleClick = () => {
        const caseIdentifiers = {
            caseId: caseSelectedInUI.caseId,
            mainTypeName: caseSelectedInUI.mainComplaintType,
            complaintTypeName: caseSelectedInUI.caseName,
        };

        setSelectedCaseDetails(caseSelectedInUI);

        // Record the selection LOCALLY, for this browser only. The Unity
        // player's hardcoded caseTeeth/get request gets these identifiers
        // appended by the interceptor (see unityCaseRequestInterceptor.js).
        //
        // This replaces the previous PUT to caseTeeth/store, which wrote the
        // selection into a single global Firestore document shared by every
        // student — so whoever selected a case last determined which teeth
        // EVERY concurrently active student's 3D model rendered. That write
        // also raced this navigate() call, since navigation was not awaited.
        setActiveCase(caseIdentifiers);
        console.log("Selected case", caseSelectedInUI);

        navigate("/historyTaking");
    };

    return (
        <Card>
            <CardActionArea onClick={handleClick}>
                <CardMedia
                    component="img"
                    height="140"
                    image={caseSelectedInUI.thumbnailImageURL}
                    alt={caseSelectedInUI.caseName}
                />
                <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                        {caseSelectedInUI.caseName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {caseSelectedInUI.caseScenario}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {caseSelectedInUI.mainComplaintType}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default CaseCard;
