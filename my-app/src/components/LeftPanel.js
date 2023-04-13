import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import "../App.css";
import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import ToggleButton from 'react-bootstrap/ToggleButton'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Form from "react-bootstrap/Form";
import axios from "axios";
import {
  drawProjection,
  clearSVG,
  changeOpacity,
  changeDotSize,
  toggleDotDisplay,
  autocheckPoints,
} from "../d3-rendering/projectionManipulationFunctions.js";
import Tooltip from '@mui/material/Tooltip';
import Slider from "@mui/material/Slider";
import CircularProgress from "@mui/material/CircularProgress";
import { InfoTooltip } from "./InfoTooltip.js";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare, faSquare } from "@fortawesome/free-solid-svg-icons";
import neurips from '../datasets/neurips.json';


library.add(faCheckSquare, faSquare);

const localDevURL = "http://127.0.0.1:8000/";

const LoadDataCircle = ({ loadingData }) => {
  if (!loadingData) {
    return <div></div>;
  } else {
    return <CircularProgress />;
  }
};

const Header = () => {
  return (
    <Navbar bg="dark" variant="dark">
      <Container>
        <Navbar.Brand href="#home">Cluster Investigator</Navbar.Brand>
      </Container>
    </Navbar>
  );
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
  const [checkedlabel, setCheckedLabel] = useState(props.label);

  const handleClick = () => {
    setChecked(!checked);
    toggleDotDisplay(!checked, props.label);
    autocheckPoints(props.label);
  };

  return (
    <div className="key-item" onClick={handleClick} spin>
      {/* Custom checkbox */}
      <FontAwesomeIcon
        icon={checked ? "check-square" : "square"}
        color={checked ? props.color : "#FAFAFA"}
      />
      <p>{props.label+" : "+props.keywords}</p>
    </div>
  );
};
window.onload = function(){
  document.getElementById('toggleButton1').click();
  //document.getElementById('toggleButton2').click();
  document.getElementById('toggleButton3').click();


}

// Data upload + control panel
export const LeftPanel = ({ width, height }) => {
  const [rawFile, setRawFile] = useState(); // File that hasn't been projected yet
  const [plottedData, setPlottedData] = useState([]); // Holds data that's currently plotted
  const [projectedFileData, setProjectedFileData] = useState([]); // Holds previously projected data that's being uploaded
  const [opacity, setOpacity] = useState(50);
  const [dotSize, setDotSize] = useState(2);
  const [clusterThresholdDist, setclusterThresholdDist] = useState(1);
  const [clusterMode, setClusterMode] = useState(false)
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
          <div className="title">
            <p>Cluster : Keywords</p>
          </div>

          {colorMap.map((info) => {

            return (
              <KeyItem
                props={{
                  label: info[0],
                  color: info[1][0],
                  keywords: info[1][1],
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
    "Upload a CSV with embeddings and metadata to project";
  const previousProjectionExplanation =
    "Here, you can upload JSON files saved using the 'bookmark projection' button below";

  // File reader
  const fileReader = new FileReader();

  // Set projected file on projected file upload
  const handleProjectedFileChange = (e) => {
    fileReader.onload = function (event) {
      console.log(JSON.parse(event.target.result))
      setProjectedFileData(JSON.parse(event.target.result));
    };

    fileReader.readAsText(e.target.files[0]);
    
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClickMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  

  const handleClose = (e,name) => {
    setAnchorEl(null);
    let loadedData = neurips

      clearSVG();
      setPlottedData(loadedData);
      let newColorMap = drawProjection(width, height, loadedData);
      setColorMap(Object.entries(newColorMap));
      let req = {
        data: JSON.stringify(loadedData),
      };

      axios //sending data to the backend
        .post(localDevURL + "quickload", req)
        .then((response) => {
         console.log('Done')
        })
        .catch((error) => {
          console.log(error);
          setLoadingData(false);
        });  
    
    

    //fetch('neurips.json')
    //.then((response) => response.json())
    //.then((json) => console.log(json));
  }

  const toggleDiv = (e, id) => {
    var x = document.getElementById(id);
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }


  // For plotting previously projected data
  const handleFilePlot = (e) => {
    console.log("entering")
    // Clears svg and plots new data if there is new data
    if (projectedFileData.length > 0) {
      console.log("entering2")

      clearSVG();
      setPlottedData(projectedFileData);
      let newColorMap = drawProjection(width, height, projectedFileData);
      setColorMap(Object.entries(newColorMap));
      let req = {
        data: JSON.stringify(projectedFileData),
      };
      console.log(projectedFileData)

      axios //sending data to the backend
        .post(localDevURL + "quickload", req)
        .then((response) => {
         console.log('Done')
        })
        .catch((error) => {
          console.log(error);
          setLoadingData(false);
        });
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
      console.log(event.target.result)


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

  //cost handleClusterThresholdChange

  // Handle file projection
  const handleFileProject = (e) => {
    e.preventDefault();

    // Submits post request if there is not a request already being processed
    if (rawFile && !loadingData && reductionMethod !== "none") {
      setLoadingData(true);

      let req = {
        data: csvOutput,
        reductionMethod: reductionMethod,
        selectedCol: selectedCol
      };

      // Constructing request based on reduction Method
      if (reductionMethod === "TSNE") {
        req.perplexity = perplexity;
      }

      axios //sending data to the backend
        .post(localDevURL + "upload-data", req)
        .then((response) => {
         //console.log("SUCCESS", response.data.data);
          let dataToPlot = response.data.data;
          clearSVG();
          setPlottedData(dataToPlot);
          let newColorMap = drawProjection(width, height, dataToPlot);
          setColorMap(Object.entries(newColorMap));
          setLoadingData(false);
          //add something to send the cluster size to backend
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
    //console.log("changing opacity", opacity / 100);
    changeOpacity(opacity / 100);
  }, [opacity]);

  // Handle dot size changes
  const handleDotSizeChange = (event, newSize) => {
    if (newSize !== dotSize) {
      setDotSize(newSize);
    }
  };

  useEffect(() => {
   //console.log("changing dot size", dotSize);
    changeDotSize(dotSize);
  }, [dotSize]);


  // Handle cluster threshold distance changes
  // const handleClusterThresholdDist = (event, newThreshold) => {
    // if (newThreshold !== clusterThresholdDist) {
    //   setclusterThresholdDist(newThreshold)
    // }

    
  // }


  const handleClusterThresholdDist = (event, newThreshold) => {
    if (newThreshold !== clusterThresholdDist) {
      setclusterThresholdDist(newThreshold)
      //console.log(clusterThresholdDist)
    }

    // Submits post request if there is not a request already being processed
    // if (clusterMode) {

      let req = {
        clusterThresholdDist: clusterThresholdDist
      };

      axios //sending data to the backend
        .post(localDevURL + "auto-cluster", req)
        .then((response) => {
          //console.log("SUCCESS affected new cluster distance");
          let dataToPlot = response.data.data;
          clearSVG();
          setPlottedData(dataToPlot);
          let newColorMap = drawProjection(width, height, dataToPlot);
          setColorMap(Object.entries(newColorMap));
          console.log(Object.entries(newColorMap));
          setLoadingData(false);
          //add something to send the cluster size to backend
        })
        .catch((error) => {
          console.log(error);
          setLoadingData(false);
        });
    // };
    };

  // useEffect(() => {
  //   console.log("changing cluster threshold dist", clusterThresholdDist);
  //   let req = {
  //     clusterThresholdDist: clusterThresholdDist
  //   };


  //   axios
  //     .post(localDevURL + "turn-on-cluster-mode", req)
  //     .then((response) => {
  //       console.log("SUCCESS affected new cluster distance");
  //       let dataToPlot = response.data.data;
  //       clearSVG();
  //       setPlottedData(dataToPlot);
  //       let newColorMap = drawProjection(width, height, dataToPlot);
  //       setColorMap(Object.entries(newColorMap));
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     });
  // }, [clusterThresholdDist])

  // Draw graph ONCE when the component mounts
  useEffect(() => {
    console.log("running effect");
    axios
      .get(localDevURL + "get-default-data")
      .then((response) => {
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
    <h2>Cluster Explainer</h2>

      <Tooltip title={uploadExplanation} arrow>
        <Button  id="toggleButton1" class="btn btn-secondary btn-xs" onClick={(e) => { toggleDiv(e, "upload-div");}}>UPLOAD DATA</Button>
        </Tooltip>
      <div id ="upload-div">
        {/* File selection */}
        <Form.Group controlId="formFile" className="mb-3">
              <Form.Control
                className="form-control input-sm"
                size="sm"
                type="file"
                accept=".csv"
                onChange={handleRawFileChange}
              />
              <Form.Select
                className="form-select input-sm"
                size="sm"
                aria-label="column-selection"
                onChange={handleColChange}
              >
                {csvColumns}
              </Form.Select>
              <Form.Select
                className="form-select input-sm"
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
                Project
              </Button>
              <LoadDataCircle loadingData={loadingData} />
        </div>
        {/* Use previously cached projection */}

        <Form.Group controlId="previousProjectionFile" className="mb-3">
        <Form.Control
          className="form-control input-sm"
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
          Load
        </Button>
        <Button
          size="sm"
          id="bookmarkButton"
          variant="outline-secondary"
          onClick={(e) => {
            handleProjectionSave(e);
          }}
        >
          Download Projection
        </Button>
        </div>
      </div>
      

      <Button
        id="demo-positioned-button"
        class="btn btn-secondary btn-xs"
        aria-controls={open ? 'demo-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClickMenu}
      >
        Quick Load
      </Button>
      <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={(e) => { handleClose(e, "neurips");}}>NeurIPS 2022</MenuItem>
        <MenuItem onClick={(e) => { handleClose(e, "rlhf");}}>RLHF Dataset</MenuItem>
        <MenuItem onClick={(e) => { handleClose(e, "vispapers");}}>Vis Paper Abstracts</MenuItem>
      </Menu>

      <Button  id="toggleButton3" class="btn btn-secondary btn-xs display-btn" onClick={(e) => { toggleDiv(e, "displaysettings-div");}}>DISPLAY SETTINGS</Button>
      <div id ="displaysettings-div">
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
      </div>
      <div>
      <h3>AutoCluster</h3>
      </div>
      <div className="sliderBlock">
      <p>Few</p><Slider
            aria-label="AutoCluster Number"
            valueLabelDisplay="auto"
            value={clusterThresholdDist}
            onChange={handleClusterThresholdDist}
            step={1}
            marks
            min={1}
            max={50}
          /><p>  Many</p>
      </div>
      {/* <div className="submitButton">
        <Button
          size="sm"
          id="changeClusterMode"
          variant="secondary"
          onClick={setClusterMode(!clusterMode)}
        >
          project
        </Button>
      </div> */}
      {renderKey()}

      

      </div>
  );
};
