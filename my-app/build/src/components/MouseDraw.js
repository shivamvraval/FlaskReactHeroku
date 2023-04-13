import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import * as d3 from "d3";
import {
  checkPoints,
  reset,
  drawToolTip,
  eraseToolTip,
} from "../d3-rendering/projectionManipulationFunctions.js";
import "../App.css";
import { RightPanel } from "./RightPanel.js";
import axios from "axios";
import { drawClouds } from "../d3-rendering/cloudFunctions.js";
import { json } from "d3";

const localDevURL = "http://127.0.0.1:5000/";

// Line element
const Line = ({ points, drawing }) => {
  const line = useMemo(() => {
    return d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y);
  }, []);

  var dataCopy = points;
  // console.log(points);

  // Closes loop if done drawing
  if (dataCopy.length > 0 && !drawing) {
    dataCopy = [...dataCopy, points[0]];
  }

  return (
    <path
      id="lasso"
      d={line(dataCopy)}
      style={{
        stroke: "blue",
        strokeWidth: 2,
        strokeLinejoin: "round",
        strokeLinecap: "round",
        fill: "rgba(0,100,255,0.05)",
      }}
    />
  );
};

export const MouseDraw = ({ x, y, width, height }) => {
  // States and state setters
  const [drawing, setDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState({ points: [] });
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [topWords, setTopWords] = useState({
    positiveWord: null,
    negativeWord: null,
  });
  const [wordsLoading, setWordsLoading] = useState(false);
  const [prompt, setPrompt] = useState(
    "What is the common theme between the selected sentences?"
  );

  const drawingAreaRef = useRef();

  // When the mouse moves, adds the newest point to the list of points for the current line
  const mouseMove = useCallback(
    function (event) {
      const [x, y] = d3.pointer(event);
      if (drawing) {
        setCurrentLine((line) => ({
          ...line,
          points: [...line.points, { x, y }],
        }));
      }
    },
    [drawing]
  );

  // Creates a new line and starts drawing
  function enableDrawing() {
    reset();
    setCurrentLine({ points: [] });
    setSelectedPoints([]);
    setDrawing(true);
    setTopWords({ positiveWord: null, negativeWord: null });
  }

  // Adds the new line to the array of lines, stops drawing on mouseup
  function disableDrawing() {
    setDrawing(false);
    // Check if points are in path on mouseup
    let { brushedPoints, categorizedPoints, selectedLabels } = checkPoints();

    // Send brushed points to right panel
    setSelectedPoints(brushedPoints);

    if (brushedPoints.length > 0) {
      // Send categorized points to back for linear classification
      setWordsLoading(true);
      axios
        .post(localDevURL + "categorize-data", {
          data: JSON.stringify(categorizedPoints),
          selectedLabels: JSON.stringify([prompt, ...selectedLabels]),
        })
        .then((response) => {
          console.log("Categorized!", response.statusText);
          let newTopWords = drawClouds(response.data.data);
          setWordsLoading(false);
          setTopWords(newTopWords);
          // TODO: do things with response
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  function handleMouseOver(e) {
    if (!drawing && e.target.tagName.toLowerCase() === "circle") {
      drawToolTip(e.target.id, width);
    }
  }

  function handleMouseOut(e) {
    if (!drawing && e.target.tagName.toLowerCase() === "circle") {
      eraseToolTip(e.target.id);
    }
  }

  // Called mouseMove on mouseover of the drawing area
  useEffect(() => {
    const area = d3.select(drawingAreaRef.current);
    area.on("mousemove", mouseMove);
    return () => area.on("mousemove", null);
  }, [mouseMove]);

  return (
    <div className="body">
      <svg
        id="containerSVG"
        width={width}
        height={height}
        onMouseDown={enableDrawing}
        onMouseUp={disableDrawing}
        onMouseOver={(e) => {
          handleMouseOver(e);
        }}
        onMouseOut={(e) => {
          handleMouseOut(e);
        }}
      >
        <g ref={drawingAreaRef}>
          {/* Drawing background, gives "g" its size */}
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            style={{ fill: "white" }}
          />
          {/* Renders lines */}
          <Line points={currentLine.points} drawing={drawing} />
        </g>
      </svg>
      <RightPanel
        selectedPoints={selectedPoints}
        pathPoints={currentLine.points}
        topWords={topWords}
        wordsLoading={wordsLoading}
      />
    </div>
  );
};
