import React, { useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from "@mui/material";
import { Search, ElectricBolt } from "@mui/icons-material";
import CustomCard from "../../common/CustomCard";

const FuelDeviceList = ({ devices = [], selectedDeviceId, onDeviceSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <CustomCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search Devices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, bgcolor: "#fff" },
          }}
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1, pb: 1 }}>
        <List disablePadding>
          {filteredDevices.map((device) => {
            const isSelected = selectedDeviceId === device.id;
            return (
              <ListItem key={device.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => onDeviceSelect(device.id)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: isSelected ? "rgba(1, 86, 166, 0.08)" : "transparent",
                    border: isSelected
                      ? "1px solid rgba(1, 86, 166, 0.2)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                    "&:hover": {
                      bgcolor: isSelected
                        ? "rgba(1, 86, 166, 0.12)"
                        : "rgba(0, 0, 0, 0.02)",
                    },
                    py: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ElectricBolt
                      sx={{
                        fontSize: 20,
                        color: isSelected ? "#0156A6" : "text.secondary",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={device.name}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "#0156A6" : "text.primary",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </CustomCard>
  );
};

export default FuelDeviceList;
