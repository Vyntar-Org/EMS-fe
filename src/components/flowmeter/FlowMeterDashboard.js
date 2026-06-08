import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Snackbar,
    useTheme,
    useMediaQuery,
    Badge,
} from "@mui/material";
import Chart from "react-apexcharts";
import MenuIcon from "@mui/icons-material/Menu";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import IconButton from "@mui/material/IconButton";
import {
    getFlowMeterDashboardSummary,
    getFlowMeterWaterComparison,
    getFlowMeterSlaveList,
} from "../../auth/flowmeter/FlowMeterDashboardApi";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Helper component to update map view
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

const FlowMeterDashboard = ({ onSidebarToggle, sidebarVisible }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"));

    // State management
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    // Device status state
    const [deviceStatus, setDeviceStatus] = useState("Running");
    const [latestTimestamp, setLatestTimestamp] = useState("");
    const [isOnline, setIsOnline] = useState(true);

    // Metric states (these would come from API)
    const [intakeTotal, setIntakeTotal] = useState(0);
    const [treatedWater, setTreatedWater] = useState(0);
    const [intakeYesterday, setIntakeYesterday] = useState(0);
    const [treatedWaterYesterday, setTreatedWaterYesterday] = useState(0);

    // Map state
    const [locations, setLocations] = useState([]);
    const [mapCenter, setMapCenter] = useState([9.9252, 78.1198]);

    // Slave list state
    const [slaves, setSlaves] = useState([]);

    // Chart data states
    const [waterCompCategories, setWaterCompCategories] = useState([]);
    const [waterCompSeries, setWaterCompSeries] = useState([]);

    const [chartLoading, setChartLoading] = useState(false);

    // Fetch latest timestamp and device status
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch Summary Data
                const summaryRes = await getFlowMeterDashboardSummary();
                const cards = summaryRes.data.cards || [];
                const locs = summaryRes.data.locations || [];

                setLocations(locs);
                if (locs.length > 0) {
                    setMapCenter([parseFloat(locs[0].latitude), parseFloat(locs[0].longitude)]);
                }

                // Map summary data to state
                cards.forEach((card) => {
                    if (card.title === "Inlet Total") {
                        setIntakeTotal(card.value);
                        setIntakeYesterday(card.previous_value);
                    } else if (card.title === "Outlet Water") {
                        setTreatedWater(card.value);
                        setTreatedWaterYesterday(card.previous_value);
                    }
                });

                // 2. Fetch Slave List
                const slaveRes = await getFlowMeterSlaveList();
                if (slaveRes.success) {
                    setSlaves(slaveRes.data.slaves || []);
                }

                // 3. Fetch Chart Data concurrently
                await loadChartData();

                // Set timestamp
                const now = new Date();
                const time = now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                });
                const day = now.getDate().toString().padStart(2, "0");
                const monthNames = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                ];
                const month = monthNames[now.getMonth()];
                const year = now.getFullYear();
                setLatestTimestamp(`Last updated : ${time} | ${day}-${month}-${year}`);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to fetch dashboard data: " + err.message);
                setSnackbarMessage("Failed to fetch dashboard data");
                setSnackbarOpen(true);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // Fetch dashboard data
    const loadChartData = async () => {
        try {
            setChartLoading(true);

            const comparisonRes = await getFlowMeterWaterComparison();

            // Set Water Comparison (Used for the "Blower Usage" / Bar Chart)
            if (comparisonRes.success) {
                setWaterCompCategories(comparisonRes.data.categories || []);
                setWaterCompSeries(comparisonRes.data.series || []);
            }
        } catch (err) {
            console.error("Error loading chart data:", err);
            setSnackbarMessage("Failed to load chart data");
            setSnackbarOpen(true);
        } finally {
            setChartLoading(false);
        }
    };

    const getGaugeOptions = (title, min, max, unit) => ({
        chart: {
            type: "radialBar",
            height: 240,
            toolbar: { show: false },
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    size: "60%",
                    background: "transparent",
                },
                track: {
                    background: "#E5E7EB",
                    strokeWidth: "97%",
                    margin: 5,
                },
                dataLabels: {
                    name: {
                        show: true,
                        fontSize: "10px",
                        color: "#6B7280",
                        offsetY: -10,
                    },
                    value: {
                        show: true,
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#1F2937",
                        offsetY: -1,
                        formatter: function (val) {
                            return val;
                        },
                    },
                },
            },
        },
        labels: [title],
        colors: ["#0156a6"],
    });

    // Water Comparison (Bar Chart) Options
    const blowerUsageOptions = {
        chart: {
            type: "bar",
            height: 350,
            toolbar: { show: false },
            background: "transparent",
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: "60%",
                dataLabels: {
                    position: "top",
                },
            },
        },
        dataLabels: {
            enabled: true,
            offsetY: -20,
            style: {
                colors: ["#0a223e"],
                fontSize: "12px",
                fontWeight: "600",
            },
        },
        grid: {
            strokeDashArray: 4,
            borderColor: "transparent",
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true, color: "#E5E7EB" } },
        },
        xaxis: {
            categories: waterCompCategories, // Use state data
            labels: {
                style: { colors: "#6B7280", fontSize: "12px" },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            title: {
                text: "Day",
                style: { color: "#6B7280", fontSize: "12px" },
            },
        },
        yaxis: {
            labels: {
                style: { colors: "#6B7280", fontSize: "12px" },
            },
            axisBorder: { show: false },
            title: {
                text: "KL",
                style: { color: "#6B7280", fontSize: "12px" },
            },
        },
        legend: {
            show: true,
            position: "top",
            horizontalAlign: "center",
            fontSize: "12px",
            labels: { colors: ["#6B7280"] },
        },
        colors: ["#0156a6", "#10B981"],
    };

    // Card styles
    const cardStyle = {
        borderRadius: "16px",
        boxShadow: "0px 8px 24px rgba(0,0,0,0.08)",
        backgroundColor: "#FFFFFF",
        height: "70%",
    };

    const metricCardStyle = {
        borderRadius: "14px",
        padding: "20px",
        boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.08)",
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "50%",
        transition: "all 0.3s ease",
        "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 4px 8px -2px rgba(0, 0, 0, 0.15)",
        },
    };

    const titleStyle = {
        fontSize: "16px",
        fontWeight: 600,
        color: "#1F2937",
        fontFamily: "sans-serif",
    };

    const metricHeadingStyle = {
        fontSize: "13px",
        fontWeight: 500,
        color: "#6B7280",
        fontFamily: "sans-serif",
        marginBottom: "0px",
        marginTop: "8px",
    };

    const metricValueStyle = {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#0156a6",
        fontFamily: "sans-serif",
    };

    const metricUnitStyle = {
        fontSize: "12px",
        color: "#6B7280",
        fontFamily: "sans-serif",
        // marginTop: "4px",
    };

    const styles = {
        mainContent: {
            width: "100%",
            minHeight: "87vh",
            fontFamily: "sans-serif",
            fontSize: "14px",
            padding: "10px",
            backgroundColor: "#F9FAFB",
        },
        navbar: {
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        },
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error && locations.length === 0) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <Typography variant="h6" color="error">
                    Error: {error}
                </Typography>
            </Box>
        )
    }
    const MetricCard = ({ children, sx }) => {
        return (
            <Card
                sx={{
                    height: { md: "100%" },
                    borderRadius: "14px",
                    boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.08)",
                    backgroundColor: "#FFFFFF",
                    transition: "all 0.3s ease",
                    "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 8px -2px rgba(0, 0, 0, 0.15)",
                    },
                    ...sx,
                }}
            >
                <CardContent
                    sx={{
                        p: "16px !important",
                        pb: "16px !important",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {children}
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            <Box
                height={{ md: "calc(100vh - 70px - 8px)" }}
                overflow="auto"
                px={1}
                pb={1}
            >
                <Grid container gap={1} height={{ md: "100%" }}>
                    <Grid
                        size={{ xs: 12, md: 7 }}
                        sx={{
                            height: { md: "100%" },
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                        }}
                    >
                        <Grid container gap={1} sx={{ flex: { md: "0 0 auto" } }}>
                            <Grid size={{ sm: "grow" }}>
                                <MetricCard>
                                    <Typography
                                        align="center"
                                        sx={{
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            color: "#1F2937",
                                            mt: 1,
                                        }}
                                    >
                                        Inlet Total
                                    </Typography>
                                    <Box display="flex" justifyContent="space-around" mt={2}>
                                        <Box>
                                            <Typography
                                                align="center"
                                                sx={{
                                                    fontSize: "12px",
                                                    color: "#3e485e",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Today
                                            </Typography>
                                            <Typography
                                                align="center"
                                                sx={{
                                                    fontSize: "12px",
                                                    color: "#6B7280",
                                                    mb: 1,
                                                }}
                                            >
                                                (Waste Water)
                                            </Typography>
                                            <Typography align="center" sx={metricValueStyle}>
                                                {intakeTotal.toLocaleString()}
                                            </Typography>
                                            <Typography align="center" sx={metricUnitStyle}>
                                                KL
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography
                                                align="center"
                                                sx={{
                                                    fontSize: "12px",
                                                    color: "#3e485e",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Yesterday
                                            </Typography>
                                            <Typography
                                                align="center"
                                                sx={{
                                                    fontSize: "12px",
                                                    color: "#6B7280",
                                                    mb: 1,
                                                }}
                                            >
                                                (Waste Water)
                                            </Typography>
                                            <Typography align="center" sx={metricValueStyle}>
                                                {intakeYesterday.toLocaleString()}
                                            </Typography>
                                            <Typography align="center" sx={metricUnitStyle}>
                                                KL
                                            </Typography>
                                        </Box>
                                    </Box>
                                </MetricCard>
                            </Grid>

                            <Grid size={{ sm: "grow" }}>
                                <MetricCard>
                                    <Typography
                                        align="center"
                                        sx={{
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            color: "#1F2937",
                                            mt: 1,
                                        }}
                                    >
                                        Outlet Water
                                    </Typography>
                                    <Box display="flex" justifyContent="space-around" mt={2}>
                                        <Box>
                                            <Typography
                                                align="center"
                                                sx={{
                                                    fontSize: "12px",
                                                    color: "#3e485e",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Today
                                            </Typography>
                                            <Typography
                                                align="center"
                                                sx={{ fontSize: "12px", color: "#6B7280", mb: 1 }}
                                            >
                                                (Out)
                                            </Typography>
                                            <Typography align="center" sx={metricValueStyle}>
                                                {treatedWater.toLocaleString()}
                                            </Typography>
                                            <Typography align="center" sx={metricUnitStyle}>
                                                KL
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography
                                                align="center"
                                                sx={{
                                                    fontSize: "12px",
                                                    color: "#3e485e",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Yesterday
                                            </Typography>
                                            <Typography
                                                align="center"
                                                sx={{ fontSize: "12px", color: "#6B7280", mb: 1 }}
                                            >
                                                (Out)
                                            </Typography>
                                            <Typography align="center" sx={metricValueStyle}>
                                                {treatedWaterYesterday.toLocaleString()}
                                            </Typography>
                                            <Typography align="center" sx={metricUnitStyle}>
                                                KL
                                            </Typography>
                                        </Box>
                                    </Box>
                                </MetricCard>
                            </Grid>
                        </Grid>

                        <Grid container size={{ xs: 12, md: "grow" }} height={{ md: "100%" }}>
                            <Grid size={{ sm: 12 }}>
                                <MetricCard>
                                    <Typography
                                        sx={{ fontSize: "14px", fontWeight: 700, color: "#1F2937", mb: 1 }}
                                    >
                                        Site Location Map
                                    </Typography>
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={14}
                                        scrollWheelZoom={false}
                                        style={{ height: "100%", width: "100%", minHeight: "300px" }}
                                    >
                                        <ChangeView center={mapCenter} zoom={14} />
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        {locations.map((loc, idx) => (
                                            <React.Fragment key={loc.device_id || idx}>
                                                <Circle
                                                    center={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
                                                    radius={400}
                                                    pathOptions={{
                                                        color: "#38bdf8",
                                                        fillColor: "#38bdf8",
                                                        fillOpacity: 0.15,
                                                    }}
                                                />
                                                <Marker position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}>
                                                    <Popup>
                                                        <strong>FlowMeter Site</strong>
                                                        <br />
                                                        Lat: {loc.latitude}
                                                        <br />
                                                        Lon: {loc.longitude}
                                                    </Popup>
                                                </Marker>
                                            </React.Fragment>
                                        ))}
                                    </MapContainer>
                                </MetricCard>
                            </Grid>
                        </Grid>
                    </Grid>

              <Grid size={{ xs: 12, md: "grow" }} height={{ md: "100%" }}>
    <MetricCard>
        <Typography sx={{ ...titleStyle, mb: 2 }}>
            water comparison
        </Typography>

        <Box sx={{ position: "relative" }}>
            {chartLoading && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.8)",
                        zIndex: 10,
                        borderRadius: "8px",
                    }}
                >
                    <CircularProgress />
                </Box>
            )}

            {!chartLoading && waterCompSeries.length > 0 && (
                <Box
                    sx={{
                        height: {
                            xs: 250, // mobile
                            sm: 300, // tablet
                            md: 500, // desktop
                            lg: 550
                        },
                        width: "100%",
                    }}
                >
                    <Chart
                        options={blowerUsageOptions}
                        series={waterCompSeries}
                        type="bar"
                        height="100%"
                        width="100%"
                    />
                </Box>
            )}
        </Box>
    </MetricCard>
</Grid>
                </Grid>
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            />
        </>
    );
};

export default FlowMeterDashboard;
