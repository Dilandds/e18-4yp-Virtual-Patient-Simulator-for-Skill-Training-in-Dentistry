import React from 'react';
import { Grid } from '@mui/material';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

// The section list here must match the category names a tutor actually
// authors questions under (Tutor_interface's HistoryQuestions.jsx ->
// `initialSections`: 'General Questions', 'Medical History', 'Habits',
// 'Dietary history', 'Others'). This used to say "Smoking and drinking
// habits" instead of "Habits" -- selecting it always looked up a category
// key that didn't exist in the fetched questions object, so it silently
// showed "No questions available" no matter how many questions a tutor had
// written under Habits.
const SECTIONS = ['General Questions', 'Medical History', 'Habits', 'Dietary history', 'Others'];

const Dropdowns = ({ handleSection, handleSelect, questionsForDropdown, selectedCaseDetails, selectedSection }) => {
    return (
        <Grid container style={{ marginLeft: "1px" }}>
            <Grid item xs={6}>
                <Dropdown
                    className="phddown1"
                    id="dropdown-menu-align-right"
                    onSelect={handleSection}
                >
                    {/* Previously this always read "Select the section", even
                        after picking one -- there was no way to tell which
                        section (if any) was currently selected. */}
                    <Dropdown.Toggle variant="success" id="dropdown-basic">
                        {selectedSection || "Select the section"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {SECTIONS.map((section) => (
                            <Dropdown.Item
                                key={section}
                                eventKey={section}
                                active={selectedSection === section}
                            >
                                {section}
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
            </Grid>
            <Grid item xs={6}>
                <div className="phddown2">
                    <DropdownButton
                        className="ddown1"
                        alignRight
                        title="Select the question"
                        id="dropdown-menu-align-right1"
                        onSelect={handleSelect}
                        variant="success"
                    >
                        {questionsForDropdown.length > 0 ? (
                            questionsForDropdown.map((question) => (
                                <Dropdown.Item eventKey={question.id} key={question.id}>
                                    {question.q}
                                </Dropdown.Item>
                            ))
                        ) : (
                            <Dropdown.Item disabled>No questions available</Dropdown.Item>
                        )}
                    </DropdownButton>
                </div>
            </Grid>
        </Grid>
    );
};

export default Dropdowns;
