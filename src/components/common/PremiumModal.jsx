import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "16px",
    backgroundColor: "#fff",
    color: "#0156A6",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },
}));

const PremiumModal = ({
  open,
  onClose,
  title,
  content,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: "center", py: 0 }}>
          <Typography variant="body1">{content}</Typography>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: "end",
          py: 1,
          borderTop: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <Button
          size="small"
          disableElevation
          onClick={onClose}
          variant="outlined"
          sx={{
            color: "#0156A6",
            borderColor: "#CCC751",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
          }}
        >
          {cancelText}
        </Button>
        <Button
          size="small"
          disableElevation
          onClick={onConfirm}
          variant="contained"
          sx={{
            backgroundColor: "#e2dc23",
            color: "#0156A6",
            "&:hover": { backgroundColor: "#e2dc23ca" },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default PremiumModal;
