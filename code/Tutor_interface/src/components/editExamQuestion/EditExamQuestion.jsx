import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    Grid,
    Box,
    Typography,
    CircularProgress,
    Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import config from '../../config.js';

// Turns whichever shape Firestore has this question's answer choices in
// (see examinationQuestionsRoutes.js -- a plain array when choices carry
// their own images, or {answerChoices: [...]} when they don't) into one
// flat local shape this form can edit either way.
const normalizeChoices = (choicesRaw) => {
    if (Array.isArray(choicesRaw)) {
        return choicesRaw.map((choice) => ({
            text: choice.text || '',
            isCorrect: !!choice.isCorrect,
            imageUrl: choice.imageUrl || null,
            removeImage: false,
        }));
    }
    const list = choicesRaw?.answerChoices || [];
    return list.map((choice) => ({
        text: choice.text || '',
        isCorrect: !!choice.isCorrect,
        imageUrl: null,
        removeImage: false,
    }));
};

// Lets a tutor fix up a question that's already been saved: reword the
// question or an answer, change which answer is correct, or remove an
// image that shouldn't be there (wrong picture attached, etc).
//
// Deliberately can't ADD or REPLACE an image here -- that needs a real file
// upload, which updateExaminationQuestion doesn't support (see the comment
// on that route). To swap in a different picture, remove the old one here
// and create a fresh question with "Add Question" instead.
const EditExamQuestion = ({ open, question, identifiers, onClose, onSaved }) => {
    const [questionText, setQuestionText] = useState('');
    const [removeQuestionImage, setRemoveQuestionImage] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (question) {
            setQuestionText(question.question || '');
            setRemoveQuestionImage(false);
            setAnswers(normalizeChoices(question.choices));
            setErrorMessage('');
        }
    }, [question]);

    if (!question) return null;

    const questionImageVisible = !!question.questionImageUrl && !removeQuestionImage;

    const handleAnswerTextChange = (index, text) => {
        setAnswers((previous) =>
            previous.map((answer, i) => (i === index ? { ...answer, text } : answer))
        );
    };

    const handleAnswerCorrectnessChange = (index, value) => {
        setAnswers((previous) =>
            previous.map((answer, i) =>
                i === index ? { ...answer, isCorrect: value === 'correct' } : answer
            )
        );
    };

    const handleRemoveAnswerImage = (index) => {
        setAnswers((previous) =>
            previous.map((answer, i) => (i === index ? { ...answer, removeImage: true } : answer))
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        setErrorMessage('');
        try {
            const response = await axios.put(
                `${config.apiBaseUrl}examintionQuestions/updateExaminationQuestion`,
                {
                    mainTypeName: identifiers.mainTypeName,
                    complaintTypeName: identifiers.complaintTypeName,
                    caseId: identifiers.caseId,
                    sectionName: identifiers.sectionName,
                    questionId: question.questionId,
                    question: questionText,
                    removeQuestionImage,
                    answerChoices: answers.map((answer) => ({
                        text: answer.text,
                        isCorrect: answer.isCorrect,
                        removeImage: answer.removeImage,
                    })),
                }
            );
            onSaved(response.data.Question);
            onClose();
        } catch (error) {
            console.error('Failed to update question:', error);
            setErrorMessage("Couldn't save these changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogContent>
                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    You can edit text, fix which answer is correct, or remove an image below.
                    To add or swap in a different image, delete this question and create a new
                    one instead.
                </Typography>

                <TextField
                    fullWidth
                    label="Question"
                    variant="outlined"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    sx={{ mb: 2 }}
                />

                {questionImageVisible && (
                    <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                        <img
                            src={question.questionImageUrl}
                            alt="Question"
                            style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            href={question.questionImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Download
                        </Button>
                        <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setRemoveQuestionImage(true)}
                        >
                            Remove image
                        </Button>
                    </Box>
                )}
                {!!question.questionImageUrl && removeQuestionImage && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        This image will be removed when you save.
                    </Typography>
                )}

                {answers.map((answer, index) => (
                    <Grid container alignItems="center" spacing={2} key={index} sx={{ mb: 1 }}>
                        <Grid item xs={12} sm={5}>
                            <TextField
                                fullWidth
                                label={`Answer ${index + 1}`}
                                variant="outlined"
                                value={answer.text}
                                onChange={(e) => handleAnswerTextChange(index, e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={8} sm={4}>
                            {answer.imageUrl && !answer.removeImage && (
                                <Box display="flex" alignItems="center" gap={1}>
                                    <img
                                        src={answer.imageUrl}
                                        alt={`Answer ${index + 1}`}
                                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
                                    />
                                    <Button
                                        size="small"
                                        href={answer.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <DownloadIcon fontSize="small" />
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveAnswerImage(index)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </Button>
                                </Box>
                            )}
                            {answer.imageUrl && answer.removeImage && (
                                <Typography variant="caption" color="text.secondary">
                                    Image will be removed
                                </Typography>
                            )}
                        </Grid>
                        <Grid item xs={4} sm={3}>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={answer.isCorrect ? 'correct' : 'incorrect'}
                                    onChange={(e) => handleAnswerCorrectnessChange(index, e.target.value)}
                                >
                                    <MenuItem value="correct">Correct</MenuItem>
                                    <MenuItem value="incorrect">Incorrect</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>
                    Cancel
                </Button>
                <Button onClick={handleSave} variant="contained" disabled={isSaving}>
                    {isSaving ? <CircularProgress size={20} /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditExamQuestion;
