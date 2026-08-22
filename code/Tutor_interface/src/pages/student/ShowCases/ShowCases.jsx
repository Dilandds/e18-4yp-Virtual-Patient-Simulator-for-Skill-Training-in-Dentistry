import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Grid,
    Button,
    Box,
    CircularProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import config from '../../../config.js';
import { EditCaseDialog } from '../../../components/Components.jsx';
import './showCases.scss';

// Lets a tutor browse every case that currently exists (across all main
// complaint types) and edit or delete one. This used to render 4 hardcoded
// placeholder cards with no real data behind them, and nothing in the app
// linked here -- see NavigationBar.jsx for the new "Manage Cases" entry
// point, and dentalComplaintCasesRoutes.js for the updateCase/deleteCase
// routes this page calls.
const ShowCases = () => {
    const [cases, setCases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [editingCase, setEditingCase] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [deletingCase, setDeletingCase] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const closeSnackbar = () => {
        setSnackbar((previous) => ({ ...previous, open: false }));
    };

    const fetchCases = () => {
        setIsLoading(true);
        setLoadError('');
        const url = `${config.apiBaseUrl}dentalComplaintCases/getAllCases`;
        axios
            .get(url)
            .then((response) => {
                setCases(response.data || []);
            })
            .catch((error) => {
                // The backend responds 404 when there simply aren't any
                // cases yet -- that's an empty list, not a real error.
                if (error.response && error.response.status === 404) {
                    setCases([]);
                } else {
                    console.error('Error fetching cases:', error);
                    setLoadError('Could not load cases. Please try again.');
                }
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchCases();
    }, []);

    // Cases don't have a single unique id of their own in this API response
    // (caseId is only unique within one mainComplaintType/caseName pair),
    // so identify one by the full triple everywhere below.
    const isSameCase = (a, b) =>
        !!a &&
        !!b &&
        a.caseId === b.caseId &&
        a.mainComplaintType === b.mainComplaintType &&
        a.caseName === b.caseName;

    const handleSaveEdit = async ({ caseScenario, file }) => {
        if (!editingCase) return;
        setIsSaving(true);

        const formData = new FormData();
        formData.append('mainTypeName', editingCase.mainComplaintType);
        formData.append('complaintTypeName', editingCase.caseName);
        formData.append('caseId', editingCase.caseId);
        formData.append('caseScenario', caseScenario);
        if (file) {
            formData.append('file', file);
        }

        const url = `${config.apiBaseUrl}dentalComplaintCases/updateCase`;

        try {
            const response = await axios.put(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setCases((previous) =>
                previous.map((item) =>
                    isSameCase(item, editingCase)
                        ? {
                              ...item,
                              caseScenario,
                              thumbnailImageURL:
                                  response.data.thumbnailImageURL || item.thumbnailImageURL,
                          }
                        : item
                )
            );
            showSnackbar('Case updated successfully.', 'success');
            setEditingCase(null);
        } catch (error) {
            console.error('Error updating case:', error);
            showSnackbar('Could not update the case. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingCase) return;
        setIsDeleting(true);

        const url = `${config.apiBaseUrl}dentalComplaintCases/deleteCase`;

        try {
            await axios.delete(url, {
                params: {
                    mainTypeName: deletingCase.mainComplaintType,
                    complaintTypeName: deletingCase.caseName,
                    caseId: deletingCase.caseId,
                },
            });
            setCases((previous) => previous.filter((item) => !isSameCase(item, deletingCase)));
            showSnackbar('Case deleted.', 'success');
            setDeletingCase(null);
        } catch (error) {
            console.error('Error deleting case:', error);
            showSnackbar('Could not delete the case. Please try again.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="showCasesContainer">
            <Typography variant="h5" sx={{ width: '100%', textAlign: 'center', mb: 3 }}>
                Manage Cases
            </Typography>

            {isLoading && (
                <Box display="flex" justifyContent="center" width="100%" mt={4}>
                    <CircularProgress />
                </Box>
            )}

            {!isLoading && loadError && <Typography color="error">{loadError}</Typography>}

            {!isLoading && !loadError && cases.length === 0 && (
                <Typography>No cases have been created yet.</Typography>
            )}

            {!isLoading && !loadError && cases.length > 0 && (
                <Grid container md={10} spacing={4}>
                    {cases.map((caseItem, index) => (
                        <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                            key={`${caseItem.mainComplaintType}-${caseItem.caseName}-${caseItem.caseId}-${index}`}
                        >
                            <Card>
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={caseItem.thumbnailImageURL}
                                    alt={caseItem.caseId}
                                />
                                <CardContent>
                                    <Typography gutterBottom variant="h6" component="div">
                                        {caseItem.mainComplaintType} - {caseItem.caseName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {caseItem.caseScenario}
                                    </Typography>
                                    <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => setEditingCase(caseItem)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => setDeletingCase(caseItem)}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <EditCaseDialog
                open={!!editingCase}
                caseItem={editingCase}
                isSaving={isSaving}
                onClose={() => setEditingCase(null)}
                onSave={handleSaveEdit}
            />

            <Dialog open={!!deletingCase} onClose={() => setDeletingCase(null)}>
                <DialogTitle>Delete this case?</DialogTitle>
                <DialogContent>
                    <Typography>
                        This permanently deletes "{deletingCase?.mainComplaintType} -{' '}
                        {deletingCase?.caseName}" and everything filed under it -- examination
                        questions, the dental chart, history-taking questions and any saved
                        student results. This can't be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeletingCase(null)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default ShowCases;
