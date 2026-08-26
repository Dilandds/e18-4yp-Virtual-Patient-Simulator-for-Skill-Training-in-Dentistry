import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Button,
    Box,
    CircularProgress,
    Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import config from '../../config.js';
import { QuestionDisplay, EditExamQuestion } from '../../components/Components.jsx';
import './manageQuestions.scss';

// Turns the Firestore shape (question/questionImageUrl/choices) into the
// shape QuestionDisplay already knows how to render (text/imageUrl/options)
// -- see components/questionDisplay/QuestionDisplay.jsx.
const toDisplayShape = (q) => {
    const choicesArray = Array.isArray(q.choices) ? q.choices : q.choices?.answerChoices || [];
    return {
        text: q.question,
        imageUrl: q.questionImageUrl,
        options: choicesArray.map((choice) => ({
            text: choice.text,
            imageUrl: choice.imageUrl || null,
            isCorrect: choice.isCorrect,
        })),
    };
};

// Lets a tutor go back into an already-created case and fix a question:
// reword it, correct which answer is right, or remove a wrong/leftover
// image -- none of which was possible before (see ShowCases.jsx, which
// links here, and EditExamQuestion.jsx for the actual editing form).
//
// Reached from "Manage Cases" > a case card's "Questions" button, which
// passes the case's identifiers via navigation state.
const ManageQuestions = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const caseIdentifiers = location.state || {};
    const { mainTypeName, complaintTypeName, caseId } = caseIdentifiers;

    const [questionsBySection, setQuestionsBySection] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [editingQuestion, setEditingQuestion] = useState(null); // { sectionName, question }

    const fetchQuestions = () => {
        setIsLoading(true);
        setLoadError('');
        axios
            .get(`${config.apiBaseUrl}examintionQuestions/getAllExaminationQuestions`, {
                params: { mainTypeName, complaintTypeName, caseId },
            })
            .then((response) => {
                setQuestionsBySection(response.data.data || {});
            })
            .catch((error) => {
                console.error('Error fetching questions:', error);
                setLoadError('Could not load this case\'s questions. Please try again.');
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (mainTypeName && complaintTypeName && caseId) {
            fetchQuestions();
        } else {
            setIsLoading(false);
            setLoadError('No case was selected. Go back to Manage Cases and pick one.');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainTypeName, complaintTypeName, caseId]);

    const handleQuestionSaved = (sectionName, updatedQuestion) => {
        setQuestionsBySection((previous) => ({
            ...previous,
            [sectionName]: (previous[sectionName] || []).map((q) =>
                q.questionId === editingQuestion.question.questionId
                    ? { ...q, ...updatedQuestion }
                    : q
            ),
        }));
    };

    const sectionNames = Object.keys(questionsBySection);

    return (
        <div className="manageQuestionsContainer">
            <Typography variant="h5" sx={{ width: '100%', textAlign: 'center', mb: 1 }}>
                Manage Questions
            </Typography>
            {mainTypeName && complaintTypeName && (
                <Typography variant="body2" color="text.secondary" sx={{ width: '100%', textAlign: 'center', mb: 3 }}>
                    {mainTypeName} - {complaintTypeName}
                </Typography>
            )}

            <Box display="flex" justifyContent="center" mb={2}>
                <Button variant="outlined" onClick={() => navigate('/showCases')}>
                    Back to Manage Cases
                </Button>
            </Box>

            {isLoading && (
                <Box display="flex" justifyContent="center" mt={4}>
                    <CircularProgress />
                </Box>
            )}

            {!isLoading && loadError && (
                <Alert severity="error" sx={{ maxWidth: 480, margin: '0 auto' }}>
                    {loadError}
                </Alert>
            )}

            {!isLoading && !loadError && sectionNames.length === 0 && (
                <Typography textAlign="center">This case has no questions yet.</Typography>
            )}

            {!isLoading &&
                !loadError &&
                sectionNames.map((sectionName) => (
                    <Box key={sectionName} sx={{ maxWidth: 900, margin: '0 auto', mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            {sectionName}
                        </Typography>
                        {(questionsBySection[sectionName] || []).length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No questions in this section.
                            </Typography>
                        )}
                        {(questionsBySection[sectionName] || []).map((question, index) => (
                            <Accordion key={question.questionId}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography sx={{ flexGrow: 1 }}>
                                        {index + 1}. {question.question}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <QuestionDisplay question={toDisplayShape(question)} />
                                    <Box display="flex" justifyContent="flex-end" mt={1}>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => setEditingQuestion({ sectionName, question })}
                                        >
                                            Edit
                                        </Button>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                ))}

            <EditExamQuestion
                open={!!editingQuestion}
                question={editingQuestion?.question}
                identifiers={{
                    mainTypeName,
                    complaintTypeName,
                    caseId,
                    sectionName: editingQuestion?.sectionName,
                }}
                onClose={() => setEditingQuestion(null)}
                onSaved={(updated) => handleQuestionSaved(editingQuestion.sectionName, updated)}
            />
        </div>
    );
};

export default ManageQuestions;
