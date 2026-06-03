import React from "react";
import CustomCard from "../../common/CustomCard";
import { Box, Typography } from "@mui/material";

import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in react-leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const STPSiteLocation = () => {
  return (
    <CustomCard>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography
          sx={{ fontSize: "14px", fontWeight: 700, color: "#1F2937", mb: 1 }}
        >
          Site Location Map
        </Typography>
        <Box
          sx={{
            flex: 1,
            width: "100%",
            borderRadius: 1,
            overflow: "hidden",
            height: { xs: "300px", sm: "400px", md: "100%" },
            minHeight: { xs: "300px", sm: "400px", md: "unset" },
            "& .leaflet-container": {
              height: "100%",
              width: "100%",
              zIndex: 1
            }
          }}
        >
          <MapContainer
            center={[9.9252, 78.1198]}
            zoom={14}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle
              center={[9.9252, 78.1198]}
              radius={400}
              pathOptions={{
                color: "#38bdf8",
                fillColor: "#38bdf8",
                fillOpacity: 0.15,
              }}
            />
            <Marker position={[9.9252, 78.1198]}>
              <Popup>
                <strong>Weather Station + Solar PV Site</strong>
                <br />
                Lat: {9.9252}
                <br />
                Lon: {78.1198}
              </Popup>
            </Marker>
          </MapContainer>
        </Box>
      </Box>
    </CustomCard>
  );
};

export default STPSiteLocation;
