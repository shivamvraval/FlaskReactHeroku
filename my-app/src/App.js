import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import { MouseDraw } from "./components/MouseDraw.js";
import { LeftPanel } from "./components/LeftPanel.js";
// import classNames from "classnames/bind";
import { Header } from "./components/Navbar.js";

function App() {
  let width = window.innerWidth - 720;
  let height = window.innerHeight - 50;
  return (
    <div className="App">
      <div className="body">
        <LeftPanel width={width} height={height} />
        <MouseDraw x={0} y={0} width={width} height={height} />
      </div>
    </div>
  );
}

export default App;
