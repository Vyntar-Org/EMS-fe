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
    color: "#595959",
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
          // size="small"
          disableElevation
          onClick={onClose}
          variant="outlined"
          sx={{
            px: 2,
            fontWeight: "bold",
            color: "#000",
            borderRadius: "24px",
            borderColor: "#F5D547",
            "&:hover": {
              borderColor: "#e8c011",
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          // size="small"
          disableElevation
          onClick={onConfirm}
          variant="contained"
          sx={{
            px: 2,
            fontWeight: "bold",
            color: "#000",
            borderRadius: "24px",
            background: "#F5D547",
            "&:hover": {
              background: "#e8c011",
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default PremiumModal;
