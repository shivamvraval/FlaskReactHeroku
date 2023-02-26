import "../App.css";
import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import axios from "axios";
import {
  drawProjection,
  clearSVG,
  changeOpacity,
  changeDotSize,
  toggleDotDisplay,
} from "../d3-rendering/projectionManipulationFunctions.js";
import Slider from "@mui/material/Slider";
import CircularProgress from "@mui/material/CircularProgress";
import { InfoTooltip } from "./InfoTooltip.js";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare, faSquare } from "@fortawesome/free-solid-svg-icons";

library.add(faCheckSquare, faSquare);

const localDevURL = "http://127.0.0.1:5000/";

const LoadDataCircle = ({ loadingData }) => {
  if (!loadingData) {
    return <div></div>;
  } else {
    return <CircularProgress />;
  }
};

const ReductionOptions = ({
  reductionMethod,
  perplexity,
  perplexityChanger,
}) => {
  // Handle perplexity changes
  const handlePerplexityChange = (event, newPerplexity) => {
    if (newPerplexity !== perplexity) {
      perplexityChanger(newPerplexity);
    }
  };

  if (reductionMethod === "TSNE") {
    return (
      <div className="sliderBlock">
        <p>Perlexity</p>
        <Slider
          size="small"
          aria-label="perplexity"
          value={perplexity}
          onChange={handlePerplexityChange}
          min={0}
          max={100}
        />
        <p className="paramValue">{perplexity}</p>
      </div>
    );
  } else if (reductionMethod === "UMAP") {
    return <div></div>;
  } else {
    return <div></div>;
  }
};

// Item in the category key
const KeyItem = ({ props }) => {
  const [checked, setChecked] = useState(true);

  const handleClick = () => {
    setChecked(!checked);
    toggleDotDisplay(!checked, props.color);
  };

  return (
    <div className="key-item" onClick={handleClick} spin>
      {/* Custom checkbox */}
      <FontAwesomeIcon
        icon={checked ? "check-square" : "square"}
        color={checked ? props.color : "#FAFAFA"}
      />
      <p>{props.label}</p>
    </div>
  );
};

// Data upload + control panel
export const LeftPanel = ({ width, height }) => {
  const [rawFile, setRawFile] = useState(); // File that hasn't been projected yet
  const [plottedData, setPlottedData] = useState([]); // Holds data that's currently plotted
  const [projectedFileData, setProjectedFileData] = useState([]); // Holds previously projected data that's being uploaded
  const [opacity, setOpacity] = useState(50);
  const [dotSize, setDotSize] = useState(2);
  const [reductionMethod, setReductionMethod] = useState("none");
  const [perplexity, setPerplexity] = useState(50);
  const [loadingData, setLoadingData] = useState(false);
  const [csvOutput, setCsvOutput] = useState("");
  const [csvColumns, setCsvColumns] = useState([
    <option key="select-a-column" value="select-a-column">
      select a column to color dots by
    </option>,
  ]); //reset
  const [colorMap, setColorMap] = useState({});
  const [selectedCol, setSelectedCol] = useState("none");

  function renderKey() {
    if (colorMap.length > 0) {
      return (
        <>
          <hr />
          <div className="title">
            <p>Category Visibility</p>
          </div>

          {colorMap.map((info) => {
            {
              console.log(info);
            }
            return (
              <KeyItem
                props={{
                  label: info[0],
                  color: info[1],
                }}
              />
            );
          })}
        </>
      );
    }
  }

  // Help explanations
  const uploadExplanation =
    "Upload a CSV with columns corresponding to embedding dimensions and a column titled 'label' that contains the token names. To color the points using categorical information, include that column in the CSV and select it in the color selection dropdown below.";
  const previousProjectionExplanation =
    "Here, you can upload JSON files saved using the 'bookmark projection' button below";

  // File reader
  const fileReader = new FileReader();

  // Set projected file on projected file upload
  const handleProjectedFileChange = (e) => {
    fileReader.onload = function (event) {
      setProjectedFileData(JSON.parse(event.target.result));
    };

    fileReader.readAsText(e.target.files[0]);
  };

  // For plotting previously projected data
  const handleFilePlot = (e) => {
    // Clears svg and plots new data if there is new data
    if (projectedFileData.length > 0) {
      clearSVG();
      setPlottedData(projectedFileData);
      let newColorMap = drawProjection(width, height, projectedFileData);
      setColorMap(Object.entries(newColorMap));
      setProjectedFileData([]);
    }
  };

  // Set raw file on raw file upload
  const handleRawFileChange = (e) => {
    setRawFile(e.target.files[0]);

    // Uses first row from CSV to create dropdown of column names
    let rows;
    fileReader.onload = function (event) {
      setCsvOutput(event.target.result);

      rows = event.target.result.split("\n");

      let colNames = rows[0].split(",");

      let colItems = [
        <option key="select-a-column" value="select-a-column">
          select a column to color dots by
        </option>,
        <option key="none" value="none">
          none
        </option>,
      ];

      for (let colName of colNames) {
        colItems.push(
          <option key={colName} value={colName}>
            {colName}
          </option>
        );
      }
      setCsvColumns(colItems);
      setSelectedCol("none");
    };

    fileReader.readAsText(e.target.files[0]);
  };

  const handleColChange = (e) => {
    setSelectedCol(e.target.value);
  };

  const handleReductionMethodChange = (e) => {
    setReductionMethod(e.target.value);
  };

  // Handle file projection
  const handleFileProject = (e) => {
    e.preventDefault();

    // Submits post request if there is not a request already being processed
    if (rawFile && !loadingData && reductionMethod !== "none") {
      setLoadingData(true);

      let req = {
        data: csvOutput,
        reductionMethod: reductionMethod,
        selectedCol: selectedCol,
      };

      // Constructing request based on reduction Method
      if (reductionMethod === "TSNE") {
        req.perplexity = perplexity;
      }

      axios
        .post(localDevURL + "upload-data", req)
        .then((response) => {
          console.log("SUCCESS", response.data.data);
          let dataToPlot = response.data.data;
          clearSVG();
          setPlottedData(dataToPlot);
          let newColorMap = drawProjection(width, height, dataToPlot);
          setColorMap(Object.entries(newColorMap));
          console.log(Object.entries(newColorMap));
          setLoadingData(false);
        })
        .catch((error) => {
          console.log(error);
          setLoadingData(false);
        });
    } else if (!rawFile) {
      alert("please upload a file");
    } else if (reductionMethod === "none") {
      alert("please select a reduction method!");
      return;
    }
  };

  // Handles save of currently projected data
  const handleProjectionSave = (e) => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(plottedData)
    )}`;
    // console.log(plottedData);
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "data.json";
    link.click();
  };

  // SLIDERS

  // Handle opacity changes
  const handleOpacityChange = (event, newOpacity) => {
    if (newOpacity !== opacity) {
      setOpacity(newOpacity);
    }
  };

  useEffect(() => {
    console.log("changing opacity", opacity / 100);
    changeOpacity(opacity / 100);
  }, [opacity]);

  // Handle dot size changes
  const handleDotSizeChange = (event, newSize) => {
    if (newSize !== dotSize) {
      setDotSize(newSize);
    }
  };

  useEffect(() => {
    console.log("changing dot size", dotSize);
    changeDotSize(dotSize);
  }, [dotSize]);

  // Draw graph ONCE when the component mounts
  useEffect(() => {
    console.log("running effect");
    axios
      .get(localDevURL + "get-default-data")
      .then((response) => {
        console.log("SUCCESS", response.data.data);
        let dataToPlot = response.data.data;
        setPlottedData(dataToPlot);
        let newColorMap = drawProjection(width, height, dataToPlot);
        setColorMap(Object.entries(newColorMap));
      })
      .catch((error) => {
        console.log(error);
      });
  }, [height, width]);

  return (
    <div className="left panel">
      <div className="title">
        <p>Upload</p>
        <InfoTooltip text={uploadExplanation} />
      </div>
      {/* File selection */}
      <Form.Group controlId="formFile" className="mb-3">
        <Form.Control
          className="form-control"
          size="sm"
          type="file"
          accept=".csv"
          onChange={handleRawFileChange}
        />
        <Form.Select
          className="form-select"
          size="sm"
          aria-label="column-selection"
          onChange={handleColChange}
        >
          {csvColumns}
        </Form.Select>
        <Form.Select
          className="form-select"
          size="sm"
          aria-label="column-selection"
          onChange={handleReductionMethodChange}
        >
          <option key="none" value="none">
            select a reduction method
          </option>
          <option key="TSNE" value="TSNE">
            T-SNE
          </option>
          <option key="UMAP" value="UMAP">
            UMAP
          </option>
        </Form.Select>
      </Form.Group>

      {/* TODO: add column selector*/}
      {/* Dimensionality reduction method selection */}
      <ReductionOptions
        reductionMethod={reductionMethod}
        perplexity={perplexity}
        perplexityChanger={setPerplexity}
      />
      <div className="submitButton">
        <Button
          size="sm"
          id="dataUploadButton"
          variant="secondary"
          onClick={(e) => {
            handleFileProject(e);
          }}
        >
          project
        </Button>
        <LoadDataCircle loadingData={loadingData} />
      </div>

      <hr />
      {/* Use previously cached projection */}
      <div className="title">
        <p>See a Bookmarked Projection</p>
        <InfoTooltip text={previousProjectionExplanation} />
      </div>
      <Form.Group controlId="previousProjectionFile" className="mb-3">
        <Form.Control
          className="form-control"
          size="sm"
          type="file"
          accept=".json"
          onChange={handleProjectedFileChange}
        />
      </Form.Group>
      <div className="button-box">
        <Button
          size="sm"
          id="cachedDataButton"
          variant="secondary"
          onClick={(e) => {
            handleFilePlot(e);
          }}
        >
          project
        </Button>
        <Button
          size="sm"
          id="bookmarkButton"
          variant="outline-secondary"
          onClick={(e) => {
            handleProjectionSave(e);
          }}
        >
          bookmark projection
        </Button>
      </div>
      <hr />

      <p className="title"> Display settings</p>
      <div className="sliderBlock">
        <p>Opacity</p>
        <Slider
          size="small"
          aria-label="opacity"
          value={opacity}
          onChange={handleOpacityChange}
          step={10}
          marks
          min={0}
          max={100}
        />
        <p className="paramValue">{opacity}</p>
      </div>
      <div className="sliderBlock">
        <p className="sliderLabel">Dot Size</p>
        <Slider
          size="small"
          aria-label="dot-size"
          value={dotSize}
          onChange={handleDotSizeChange}
          step={0.5}
          marks
          min={0}
          max={5}
        />
        <p className="paramValue">{dotSize}</p>
      </div>
      {renderKey()}
    </div>
  );
};
