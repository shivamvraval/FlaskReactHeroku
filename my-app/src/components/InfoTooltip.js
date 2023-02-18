import React, { useState, useRef } from "react";
import { QuestionCircle } from "react-bootstrap-icons";
import Overlay from "react-bootstrap/Overlay";

export const InfoTooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  const target = useRef(null);

  return (
    <>
      <QuestionCircle
        className="help-icon"
        size={14}
        ref={target}
        onMouseDown={() => setShow(true)}
        onMouseOver={() => setShow(true)}
        onMouseOut={() => setShow(false)}
      />
      <Overlay target={target.current} show={show} placement="bottom">
        {({ placement, arrowProps, show: _show, popper, ...props }) => (
          <div
            {...props}
            style={{
              position: "absolute",
              backgroundColor: "rgba(100, 100, 100, 0.85)",
              padding: "2px 10px",
              marginTop: "5px",
              color: "white",
              borderRadius: 3,
              fontSize: "0.9em",
              width: "20em",
              ...props.style,
            }}
          >
            {text}
          </div>
        )}
      </Overlay>
    </>
  );
};
