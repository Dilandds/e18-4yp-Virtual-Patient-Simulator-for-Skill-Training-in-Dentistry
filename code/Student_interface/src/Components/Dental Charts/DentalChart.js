import "./Chart.css";
import BackTooth from "../DentalChartTooth/BackTooth.jsx";
import FrontTooth from "../DentalChartTooth/FrontTooth.jsx";
import React, { useContext, useEffect, useState } from "react";
import { Box, Button, Grid } from "@mui/material";
import axios from "axios";
import TitleBox from "../ExaminationQuestions/TitleBox.js";
import QuestionBox from "../ExaminationQuestions/QuestionBox.js";
import QuestionComponent from "../ExaminationQuestions/QuestionComponent.js";
import { CaseContext } from "../../context/CaseContext";
import BASE_URL from "../../config";

// The condition fields every tooth carries, in both the tutor's authored
// chart and the student's chart below -- same shape on both sides, on
// purpose, so they can be compared field-by-field.
const CONDITION_FIELDS = [
  "cracked",
  "cavity",
  "amalgamFilling",
  "CompositeFilling",
  "Crown",
  "Veneer",
  "discolouration",
  "partiallyErupted",
];

// A short, readable summary of what's notable about one tooth's chart
// entry, for the feedback table -- e.g. ["cavity: cavity_shape_1"] or
// ["no defects noted"].
function summarizeTooth(tooth) {
  const notes = [];
  if (!tooth) return ["(not marked)"];
  if (tooth.isPresent === "no") notes.push("missing");
  CONDITION_FIELDS.forEach((field) => {
    if (tooth[field] && tooth[field] !== "no") {
      notes.push(`${field}: ${tooth[field]}`);
    }
  });
  return notes.length ? notes : ["no defects noted"];
}

// DentalChart component
const DentalChart = ({ onComplete }) => {
  const { selectedCaseDetails } = useContext(CaseContext);
  const [tutorTeeth, setTutorTeeth] = useState(null);
  const [teethDetails, setTeethDetails] = useState([
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth18",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth17",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth16",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth15",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth14",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth13",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth12",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth11",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth21",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth22",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth23",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth24",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth25",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth26",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth27",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth28",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth48",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth47",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth46",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth45",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth44",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth43",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth42",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth41",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth31",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth32",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth33",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth34",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth35",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth36",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth37",
      cracked: "no",
    },
    {
      discolouration: "no",
      Veneer: "no",
      Crown: "no",
      partiallyErupted: "no",
      CompositeFilling: "no",
      isPresent: "yes",
      cavity: "no",
      amalgamFilling: "no",
      toothId: "Tooth38",
      cracked: "no",
    },
  ]);

  // Fetch the tutor's authored chart for this case (the same document Unity
  // renders from, see caseTeethRoutes.js) so the student's marks can be
  // graded against it on submit.
  useEffect(() => {
    let cancelled = false;
    const fetchTutorChart = async () => {
      try {
        const url =
          `${BASE_URL}teethDetails/get` +
          `?mainTypeName=${selectedCaseDetails.mainComplaintType}` +
          `&complaintTypeName=${selectedCaseDetails.caseName}` +
          `&caseId=${selectedCaseDetails.caseId}` +
          `&sectionName=toothDetails`;
        const response = await axios.get(url);
        if (!cancelled) setTutorTeeth(response.data?.data?.Teeth || []);
      } catch (error) {
        console.error("Could not fetch tutor's dental chart:", error);
        if (!cancelled) setTutorTeeth([]);
      }
    };
    if (selectedCaseDetails?.caseId) fetchTutorChart();
    return () => {
      cancelled = true;
    };
  }, [selectedCaseDetails]);

  // Grades the student's chart against the tutor's, tooth by tooth: a tooth
  // counts as correctly identified only if every condition field (and
  // presence) matches exactly. Sends the result up the same way a graded
  // exam section does (see useExamSection.js / ExaminationQuestionSections.js)
  // so it folds into the same total score without any special-casing there.
  const handleSubmit = () => {
    const formattedDetails = teethDetails.map((detail) => ({
      toothId: detail.toothId,
      isPresent: detail.isPresent,
      cracked: detail.status === "crack" ? detail.shape : "no",
      cavity: detail.status === "cavity" ? detail.shape : "no",
      amalgamFilling: detail.status === "amalgamFilling" ? detail.shape : "no",
      CompositeFilling: detail.status === "Composite" ? detail.shape : "no",
      Crown: detail.status === "crown" ? detail.shape : "no",
      Veneer: detail.status === "veneer" ? detail.shape : "no",
      discolouration: detail.status === "discolouration" ? detail.shape : "no",
      partiallyErupted:
        detail.status === "partiallyErupted" ? detail.shape : "no",
    }));

    const tutorChart = tutorTeeth || [];
    const details = formattedDetails.map((studentTooth) => {
      const tutorTooth = tutorChart.find(
        (t) => t.toothId === studentTooth.toothId
      );
      const isCorrect =
        !!tutorTooth &&
        studentTooth.isPresent === tutorTooth.isPresent &&
        CONDITION_FIELDS.every(
          (field) => studentTooth[field] === tutorTooth[field]
        );
      return {
        question: studentTooth.toothId,
        selected: summarizeTooth(studentTooth),
        correct: summarizeTooth(tutorTooth),
        isCorrect,
      };
    });

    const correct = details.filter((d) => d.isCorrect).length;

    if (onComplete) {
      onComplete({
        sectionName: "DentalChart",
        total: details.length,
        correct,
        details,
      });
    }
  };

  const handleToothUpdate = (toothDetail) => {
    setTeethDetails((prevDetails) => {
      const updatedDetails = prevDetails.filter(
        (detail) => detail.toothId !== toothDetail.toothId
      );
      return [...updatedDetails, toothDetail];
    });
  };

  const boxStyle = {
    width: "30%",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "start",
    marginRight: "300px",
  };

  const title = "Dental Chart Examination";
  const subTitle =
    "Below you can see the dental chart. Click on a tooth box to select its options";

  return (
    <div>
      <div style={boxStyle}>
        <TitleBox title={title} subTitle={subTitle} />
      </div>
      {/* Upper Row */}
      <div style={{ marginTop: "150px", marginLeft: "685px" }}>
        <div className="dental-chart">
          <div>
            <p>18</p>
            <BackTooth toothId="Tooth18" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>17</p>
            <BackTooth toothId="Tooth17" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>16</p>
            <BackTooth toothId="Tooth16" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>15</p>
            <BackTooth toothId="Tooth15" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>14</p>
            <BackTooth toothId="Tooth14" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>13</p>
            <FrontTooth toothId="Tooth13" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>12</p>
            <FrontTooth toothId="Tooth12" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>11</p>
            <FrontTooth toothId="Tooth11" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>21</p>
            <FrontTooth toothId="Tooth21" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>22</p>
            <FrontTooth toothId="Tooth22" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>23</p>
            <FrontTooth toothId="Tooth23" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>24</p>
            <BackTooth toothId="Tooth24" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>25</p>
            <BackTooth toothId="Tooth25" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>26</p>
            <BackTooth toothId="Tooth26" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>27</p>
            <BackTooth toothId="Tooth27" onUpdate={handleToothUpdate} />
          </div>
          <div>
            <p>28</p>
            <BackTooth toothId="Tooth28" onUpdate={handleToothUpdate} />
          </div>
        </div>
        {/* Lower Row */}
        <div className="dental-chart">
          <div>
            <BackTooth toothId="Tooth48" onUpdate={handleToothUpdate} />
            <p>48</p>
          </div>
          <div>
            <BackTooth toothId="Tooth47" onUpdate={handleToothUpdate} />
            <p>47</p>
          </div>
          <div>
            <BackTooth toothId="Tooth46" onUpdate={handleToothUpdate} />
            <p>46</p>
          </div>
          <div>
            <BackTooth toothId="Tooth45" onUpdate={handleToothUpdate} />
            <p>45</p>
          </div>
          <div>
            <BackTooth toothId="Tooth44" onUpdate={handleToothUpdate} />
            <p>44</p>
          </div>
          <div>
            <FrontTooth toothId="Tooth43" onUpdate={handleToothUpdate} />
            <p>43</p>
          </div>
          <div>
            <FrontTooth toothId="Tooth42" onUpdate={handleToothUpdate} />
            <p>42</p>
          </div>
          <div>
            <FrontTooth toothId="Tooth41" onUpdate={handleToothUpdate} />
            <p>41</p>
          </div>
          <div>
            <FrontTooth toothId="Tooth31" onUpdate={handleToothUpdate} />
            <p>31</p>
          </div>
          <div>
            <FrontTooth toothId="Tooth32" onUpdate={handleToothUpdate} />
            <p>32</p>
          </div>
          <div>
            <FrontTooth toothId="Tooth33" onUpdate={handleToothUpdate} />
            <p>33</p>
          </div>
          <div>
            <BackTooth toothId="Tooth34" onUpdate={handleToothUpdate} />
            <p>34</p>
          </div>
          <div>
            <BackTooth toothId="Tooth35" onUpdate={handleToothUpdate} />
            <p>35</p>
          </div>
          <div>
            <BackTooth toothId="Tooth36" onUpdate={handleToothUpdate} />
            <p>36</p>
          </div>
          <div>
            <BackTooth toothId="Tooth37" onUpdate={handleToothUpdate} />
            <p>37</p>
          </div>
          <div>
            <BackTooth toothId="Tooth38" onUpdate={handleToothUpdate} />
            <p>38</p>
          </div>
        </div>
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <button onClick={handleSubmit} className="chrt-submit-btn">
            Submit
          </button>
        </Box>
      </div>
    </div>
  );
};

export default DentalChart;
