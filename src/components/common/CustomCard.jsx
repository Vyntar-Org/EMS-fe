import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  alpha,
  styled,
} from "@mui/material";
import ResponsiveTextWrapper from "./ResponsiveTextWrapper";

const StyledCard = styled(Card)(({ theme, accentcolor }) => ({
  position: "relative",
  overflow: "visible",
  borderRadius: "16px",
  background: "#ffffff",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  border: `1px solid ${alpha(accentcolor || "#CCC751", 0.2)}`,
  boxShadow: `0 4px 20px 0 ${alpha("#000", 0.05)}`,
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `0 12px 30px 0 ${alpha(accentcolor || "#CCC751", 0.15)}`,
    borderColor: alpha(accentcolor || "#CCC751", 0.5),
  },
  height: "100%",
}));

const CustomCard = ({
  title,
  subtitle,
  icon,
  children,
  isPremium = false,
  accentColor = "#CCC751",
  titleIcon,
  childrenOtherProps = {},
  loading = false,
  ...props
}) => {
  return (
    <StyledCard accentcolor={accentColor} {...props}>
      <CardContent sx={{ p: "14px !important", height: "100%" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        ) : (
          <>
            {(title || subtitle || icon) && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  mb: 1,
                }}
                width="100%"
              >
                {title && (
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    width="100%"
                  >
                    {titleIcon && titleIcon}

                    <Box width={titleIcon ? "calc(100% - 24px - 8px)" : "100%"}>
                      <ResponsiveTextWrapper
                        value={title}
                        color="#0A223E"
                        fontWeight={700}
                      />
                    </Box>
                  </Box>
                )}
                {subtitle && (
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontWeight: 500 }}
                  >
                    {subtitle}
                  </Typography>
                )}
                {icon && icon}
              </Box>
            )}

            <Box
              height={`calc(100% ${title || subtitle || icon ? "- 14px - 18px" : ""}  )`}
              overflow="auto"
              {...childrenOtherProps}
            >
              {children}
            </Box>
          </>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default CustomCard;
