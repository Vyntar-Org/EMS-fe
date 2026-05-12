/* eslint-disable react/prop-types */
import { Tooltip, Typography } from "@mui/material";
import React, { useEffect, useRef, useState, useMemo } from "react";

const ResponsiveTextWrapper = ({
  value,
  charLimit = null,
  tooltipValue = null,
  ...otherProps
}) => {
  const textRef = useRef(null);
  const [isEllipsed, setIsEllipsed] = useState(false);

  const displayValue = useMemo(() => {
    if (charLimit !== null && value?.length > charLimit) {
      return `${value.substring(0, charLimit)}...`;
    }
    return value;
  }, [value, charLimit]);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const checkEllipsis = () => {
      setIsEllipsed(element.scrollWidth > element.clientWidth + 1);
    };

    const resizeObserver = new ResizeObserver(checkEllipsis);
    resizeObserver.observe(element);

    checkEllipsis();

    return () => resizeObserver.disconnect();
  }, [value]);

  const showTooltip =
    isEllipsed || (charLimit !== null && value?.length > charLimit);

  return (
    <Tooltip
      title={showTooltip ? tooltipValue || value : ""}
      placement="top"
      arrow
      disableHoverListener={!showTooltip}
      disableTouchListener={!showTooltip}
    >
      <Typography
        ref={textRef}
        sx={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          display: "block",
          width: "100%",
          ...otherProps.sx,
        }}
        {...otherProps}
      >
        {displayValue}
      </Typography>
    </Tooltip>
  );
};

export default React.memo(ResponsiveTextWrapper);
