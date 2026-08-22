import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Lets a tutor edit an existing case's scenario text and, optionally,
// replace its thumbnail image. caseId/mainComplaintType/caseName aren't
// editable here -- they're also the Firestore path the case (and all its
// question sections) lives under, so renaming them is out of scope.
const EditCaseDialog = ({ open, onClose, caseItem, onSave, isSaving }) => {
    const [caseScenario, setCaseScenario] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // Reset the form whenever a different case is opened for editing.
    useEffect(() => {
        if (caseItem) {
            setCaseScenario(caseItem.caseScenario || '');
            setPreviewUrl(caseItem.thumbnailImageURL || '');
            setSelectedFile(null);
        }
    }, [caseItem]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = () => {
        onSave({ caseScenario, file: selectedFile });
    };

    if (!caseItem) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                Edit Case -- {caseItem.mainComplaintType} / {caseItem.caseName}
            </DialogTitle>
            <DialogContent>
                {previewUrl && (
                    <Box mb={2} display="flex" justifyContent="center">
                        <img
                            src={previewUrl}
                            alt="Case thumbnail"
                            style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 4 }}
                        />
                    </Box>
                )}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Case Scenario"
                    multiline
                    minRows={3}
                    fullWidth
                    variant="outlined"
                    value={caseScenario}
                    onChange={(event) => setCaseScenario(event.target.value)}
                />
                <Box mt={1}>
                    <label htmlFor="edit-case-thumbnail">
                        <input
                            accept="image/*"
                            id="edit-case-thumbnail"
                            type="file"
                            onChange={handleFileChange}
                            hidden
                        />
                        <Button component="span" startIcon={<CloudUploadIcon />}>
                            Replace Thumbnail
                        </Button>
                    </label>
                    {selectedFile && (
                        <Typography variant="caption" display="block">
                            New image selected: {selectedFile.name}
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={isSaving || !caseScenario}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditCaseDialog;
