import * as d3 from "d3";

// TODO FIX originalColor bug
// Storing state location data for quicker access
/*
  Schema:
  database = {
    id: {
      cx: float
      cy: float
      label: string
      originalColor: color
    }
  }
  */

let database = {};
let colorMap = {};
let globalOpacity = 0.5;
let globalDotSize = 2;

function clearSVG() {
  // SVG
  var svg = d3.select("#containerSVG");
  svg.selectAll("circle").remove();
  svg.selectAll("#lasso").attr("d", "");
}

// Function to draw graph, called once at render time
/*
  Schema:
  width = float
  height = float
  dataFromFront = [x, y, label, color(if color column selected)]
*/
function drawGraph(width, height, dataFromFront) {
  let data = JSON.parse(JSON.stringify(dataFromFront));
  // Location var
  var margin = { top: 20, right: 0, bottom: 50, left: 85 },
    svg_dx = width,
    svg_dy = height,
    plot_dx = svg_dx - margin.right - margin.left,
    plot_dy = svg_dy - margin.top - margin.bottom;

  var x = d3.scaleLinear().range([margin.left, plot_dx]),
    y = d3.scaleLinear().range([plot_dy, margin.top]);

  // SVG
  var svg = d3.select("#containerSVG");

  // Re-setting database and colorMap and using uploaded data to draw when data has been loaded
  database = {};
  colorMap = {};

  if (data[0].length === 4) {
    makeColorMap(data);
  }

  var d_extent_x = d3.extent(data, (d) => +d[0]),
    d_extent_y = d3.extent(data, (d) => +d[1]);

  // Draw axes
  x.domain(d_extent_x);
  y.domain(d_extent_y);

  // Generate IDs for points
  for (let row of data) {
    row.push(makeid(10));
  }

  // Draw circles
  svg
    .append("g")
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", globalDotSize)
    .attr("opacity", globalOpacity)
    .attr("id", (d) => {
      let id = d[d.length - 1];
      database[id] = { label: d[2] };
      return id;
    })
    .attr("cx", (d) => {
      let centerX = x(+d[0]);
      database[d[d.length - 1]].cx = centerX;
      return centerX;
    })
    .attr("cy", (d) => {
      let centerY = y(+d[1]);
      database[d[d.length - 1]].cy = centerY;
      return centerY;
    })
    .attr("fill", (d) => {
      if (d.length === 5) {
        return assignColor(d[3], d[4]);
      } else {
        database[d[d.length - 1]].originalColor = "black";
        return "black";
      }
    })
    .attr("class", "non-brushed");

  svg.append("g");
  return data;
}

function makeColorMap(data) {
  let uniqueCategories = new Set();
  for (let item of data) {
    if (uniqueCategories.has(item[3])) {
      continue;
    } else {
      uniqueCategories.add(item[3]);
    }
  }

  let categoriesArray = Array.from(uniqueCategories);
  for (let i = 0; i < categoriesArray.length; i++) {
    colorMap[categoriesArray[i]] = i % 11;
  }
}

const colors = [
  "#8fd7ff",
  "#71f5ac",
  "#ff66ff",
  "#feff70",
  "#f7bf6d",
  "#8faa6a",
  "#ff7c78",
  "#e14e3d",
  "#ac8f4c",
  "#003CFF",
  "#9500F2",
];

function assignColor(category, id) {
  database[id].category = category;
  database[id].originalColor = colors[colorMap[category]];
  return colors[colorMap[category]];
}

// Check if points are within path on mouseup
function checkPoints() {
  var path = document.getElementById("lasso");
  let svg = document.getElementsByTagName("svg")[0];
  let brushedPoints = [];
  let categorizedPoints = [];
  // d3.polygonContains(lassoPolygon, [x, y]);
  for (let [id, idInfo] of Object.entries(database)) {
    const point = svg.createSVGPoint();

    point.x = idInfo.cx;
    point.y = idInfo.cy;
    // Check if point is in path
    if (path.isPointInFill(point)) {
      idInfo.id = id;
      brushedPoints.push(idInfo);
      categorizedPoints.push([idInfo.label, 1]);
      // Change class and recolor points accordingly
      let selector = "#" + id;
      d3.selectAll(selector)
        .attr("class", "brushed")
        .attr("fill", (d, i, elements) => {
          let color = database[id].originalColor;
          if (d3.select(elements[i]).attr("class") === "brushed") {
            color = "orange";
          }

          return color;
        });
    } else categorizedPoints.push([idInfo.label, 0]);
  }
  return { brushedPoints: brushedPoints, categorizedPoints: categorizedPoints };
}

// Re-color formerly brushed circles
function reset() {
  d3.select("#positive-cloud").remove();
  d3.select("#negative-cloud").remove();
  d3.selectAll("circle")
    .attr("class", "non-brushed")
    .attr("fill", function () {
      let color =
        database[d3.select(this).attr("id")] === undefined
          ? "black"
          : database[d3.select(this).attr("id")].originalColor;
      return color;
    })
    .attr("r", globalDotSize)
    .attr("opacity", globalOpacity);
  d3.selectAll(".pointLabel").remove();
}

// Make random id strings
function makeid(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function changeOpacity(opacity) {
  d3.selectAll("circle").attr("opacity", opacity);
  globalOpacity = opacity;
}
function changeDotSize(dotSize) {
  d3.selectAll("circle").attr("r", dotSize);
  globalDotSize = dotSize;
}

function highlightLabel(event) {
  // Reset previously highlighted labels
  d3.selectAll(".brushed")
    .attr("fill", "orange")
    .attr("opacity", globalOpacity)
    .attr("class", "brushed")
    .attr("r", globalDotSize);
  let ids = event.target.id.split(" ");

  // Highlight labels corresponding to ids
  for (let id of ids) {
    d3.select("#" + id)
      .attr("fill", "green")
      .attr("class", "brushed selected")
      .attr("opacity", globalOpacity + 0.5)
      .attr("r", globalDotSize + 2);
  }
}

// Draws tool tip for specific point on hover
function drawToolTip(id, width) {
  let pointInfo = database[id];
  let svg = d3.select("#containerSVG");
  let toolTipWidth = 340;
  let rectPadding = 1;
  let hasCategory = database[id].originalColor != "black" ? true : false;

  // If dot is on right side of screen, flip tooltip
  let leftflip = false;
  if (pointInfo.cx > width / 2) {
    leftflip = true;
  }

  // If dot is too high up, flip tooltip
  let bottomflip = false;

  // Draw tooltip of label text with rectangular border
  // g element to hold the rect and text
  var pointLabelContainer = svg
    .append("g")
    .attr("transform", "translate(" + pointInfo.cx + "," + pointInfo.cy + ")")
    .attr("class", "pointLabel")
    .attr("id", id + "label");

  // Text
  let toytext = pointLabelContainer
    .append("text")
    .text("item: " + pointInfo.label)
    .attr("x", () => {
      if (!leftflip) {
        return rectPadding + "em";
      } else {
        return -toolTipWidth;
      }
    })
    .attr("y", -60 + rectPadding + 12)
    .attr("id", "toyText");

  let lines = wrap(toytext, toolTipWidth - 2 * rectPadding);

  d3.select("#toyText").remove();

  // Rect
  let toolTipHeight = 1.1 * (lines + 1) + 1;

  // Flips tooltip if it's too close to the top
  console.log(pointInfo.cy, toolTipHeight);
  if (pointInfo.cy < 100) {
    bottomflip = true;
  }

  if (hasCategory) {
    toolTipHeight = 1.1 * (lines + 4) + 1;
  }

  pointLabelContainer
    .append("rect")
    .attr("x", () => {
      if (!leftflip) {
        return 10;
      } else {
        return -(toolTipWidth + 10);
      }
    })
    .attr("y", () => {
      if (!bottomflip) {
        return -3 + "em";
      } else {
        return 0;
      }
    })
    .attr("width", toolTipWidth)
    .attr("height", toolTipHeight + "em")
    .attr("fill", "white")
    .attr("stroke", "black")
    .attr("stroke-width", "1px")
    .style("z-index", "1");

  // Change fill/size of the corresponding point
  d3.select("#" + id)
    .attr("fill", "green")
    .attr("opacity", globalOpacity + 0.5)
    .attr("r", globalDotSize + 2);

  pointLabelContainer
    .append("text")
    .text("item: " + pointInfo.label)
    .attr("x", () => {
      if (!leftflip) {
        return rectPadding + "em";
      } else {
        return -toolTipWidth;
      }
    })
    .attr("y", () => {
      if (!bottomflip) {
        return -3 + rectPadding + 0.3 + "em";
      } else {
        return rectPadding + 0.3 + "em";
      }
    })
    .style("z-index", "10")
    .attr("font-family", "Arial")
    .attr("fill", "black")
    .attr("stroke-width", "1px")
    .style("z-index", "10")
    .attr("vector-effect", "non-scaling-stroke")
    .call(wrap, toolTipWidth - 2 * 10);

  // Add category information if has category
  if (hasCategory) {
    pointLabelContainer
      .append("text")
      .text("category: " + pointInfo.category)
      .attr("x", () => {
        if (!leftflip) {
          return rectPadding + "em";
        } else {
          return -toolTipWidth;
        }
      })
      .attr("y", () => {
        if (!bottomflip) {
          return -3 + toolTipHeight - 1.1 + "em";
        } else {
          return toolTipHeight - 1.1 + "em";
        }
      })
      .style("z-index", "10")
      .attr("font-family", "Arial")
      .attr("fill", "black")
      .attr("stroke-width", "1px")
      .style("z-index", "10")
      .attr("vector-effect", "non-scaling-stroke");
  }
}

// Function for wrapping svg text elements
function wrap(text, width) {
  let lines = 0;
  text.each(function () {
    var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      x = text.attr("x"),
      y = text.attr("y"),
      dy = 0, //parseFloat(text.attr("dy")),
      tspan = text
        .text(null)
        .append("tspan")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", dy + "em");
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
    lines = lineNumber;
  });

  return lines;
}

// Function for removing a tooltip from the DOM on mouseOut
function eraseToolTip(id) {
  let className = d3.select("#" + id).attr("class");

  d3.select("#" + id + "label").remove();

  // Resetting points to appropriate fill, opacity, and radius based on state
  d3.select("#" + id)
    .attr("fill", () => {
<<<<<<< Updated upstream:frontend/src/helperFunctions.js
      if (className === "brushed") {
        return "orange";
      } else if (className === "brushed selected") {
        return "green";
      } else {
        return database[id].originalColor;
=======
      switch (POINT_CLASS_NAME) {
        case "brushed":
          return "orange";
        case "brushed selected":
          return "green";
        case "matches-substring brushed":
          return "salmon";
        default:
          return database[id].originalColor;
>>>>>>> Stashed changes:frontend/src/d3-rendering/projectionManipulationFunctions.js
      }
    })
    .attr("opacity", () => {
      if (className === "brushed") {
        return globalOpacity;
      } else if (className === "brushed selected") {
        return globalOpacity + 0.5;
      } else {
        return globalOpacity;
      }
    })
    .attr("r", () => {
      if (className === "brushed") {
        return globalDotSize;
      } else if (className === "brushed selected") {
        return globalDotSize + 2;
      } else {
        return globalDotSize;
      }
    });
}

// Gets centroid of set of points
function getCentroid(pts) {
  var first = pts[0],
    last = pts[pts.length - 1];
  if (first.x != last.x || first.y != last.y) pts.push(first);
  var twicearea = 0,
    x = 0,
    y = 0,
    nPts = pts.length,
    p1,
    p2,
    f;
  for (var i = 0, j = nPts - 1; i < nPts; j = i++) {
    p1 = pts[i];
    p2 = pts[j];
    f = p1.x * p2.y - p2.x * p1.y;
    twicearea += f;
    x += (p1.x + p2.x) * f;
    y += (p1.y + p2.y) * f;
  }
  f = twicearea * 3;
  return { x: x / f, y: y / f };
}

<<<<<<< Updated upstream:frontend/src/helperFunctions.js
=======
function findMatchingPoints(substring) {
  substring = substring.toLowerCase();
  // Changes opacity of dots to look like something's loading
  // d3.selectAll("circle").attr("opacity", 0.1);

  // TODO: make color black for colored plot
  // Highlight points whose labels match the substring
  const COLORFUL = Object.entries(colorMap).length > 0 ? true : false;

  d3.selectAll("circle")
    .filter(function (d) {
      if (d[2] !== undefined) {
        let lowerCaseLabel = d[2].toLowerCase();
        return lowerCaseLabel.includes(substring);
      } else {
        return false;
      }
    })
    .attr("fill", function (d) {
      if (COLORFUL) {
        return "black";
      } else {
        return "salmon";
      }
    })
    .attr("class", "matches-substring brushed")
    .attr("opacity", globalOpacity);
}

function clearSelectedMatchingPoints() {
  d3.selectAll(".matches-substring").attr("class", "brushed");
}

>>>>>>> Stashed changes:frontend/src/d3-rendering/projectionManipulationFunctions.js
export {
  drawGraph,
  checkPoints,
  reset,
  clearSVG,
  changeOpacity,
  changeDotSize,
  highlightLabel,
  drawToolTip,
  eraseToolTip,
  getCentroid,
};
