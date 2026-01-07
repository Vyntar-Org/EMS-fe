import React from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
} from '@mui/material';
import {
    Power,
    FlashOn,
    Speed,
    TrendingUp,
    ElectricBolt,
    Timeline,
    BarChart
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import SpeedIcon from '@mui/icons-material/Speed';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PowerIcon from '@mui/icons-material/Power';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import TimelineIcon from '@mui/icons-material/Timeline';

const EquipmentInsight = ({ onSidebarToggle, sidebarVisible }) => {
    // Define styles based on the provided requirements
    const containerStyle = {
        display: 'flex',
        gap: '18px',
        justifyContent: 'space-between',
        width: '100%',
        mb: 3,
        marginLeft: '1px',
        marginRight: '-15px',
        boxSizing: 'border-box',
    };

    const cardStyle = {
        width: '100%',
        minHeight: '90px',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 6px 18px rgba(31, 78, 121, 0.18)',
        display: 'flex',
        padding: '18px',
        boxSizing: 'border-box',
        gap: '18px',
        position: 'relative',
        overflow: 'hidden'
    };

    const iconContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '16px'
    };

    const iconStyle = {
        fontSize: '25px',
        lineHeight: '50px',
        color: '#5A5A5A',
        display: 'flex',
        alignItems: 'center',
    };

    const contentStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    };

    const titleStyle = {
        fontSize: '13px',
        fontWeight: 500,
        color: '#9e9e9e',
        textAlign: 'left',
        marginBottom: '8px'
    };

    const valueContainerStyle = {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between'
    };

    const valueStyle = {
        fontSize: '26px',
        fontWeight: 700,
        lineHeight: 1,
        marginTop: '6px'
    };

    const unitStyle = {
        fontSize: '14px',
        color: '#9e9e9e',
        alignSelf: 'flex-end',
        paddingBottom: '4px'
    };

    const styles = {
        sectionContainer: {
            backgroundColor: '#F5F5F5',
            padding: '24px',
            borderRadius: '8px',
        },
        cardsContainer: {
            display: 'flex',
            gap: '22px',
            justifyContent: 'space-between',
        },
        voltageCard: {
            width: '520px',
            height: '150px',
            borderRadius: '18px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.10)',
            padding: '24px',
            position: 'relative',
        },
        frequencyCard: {
            width: '280px',
            height: '150px',
            borderRadius: '18px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.10)',
            padding: '24px',
            position: 'relative',
        },
        cardTitle: {
            position: 'absolute',
            bottom: '16px',
            right: '20px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#9E9E9E',
        },
        phaseContainer: {
            display: 'flex',
            justifyContent: 'space-around',
            height: '100%',
            alignItems: 'center',
        },
        frequencyContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
        },
        phaseValue: {
            fontSize: '24px',
            fontWeight: 700,
            color: '#4B4B4B',
        },
        phaseUnit: {
            fontSize: '16px',
            fontWeight: 500,
            color: '#6B7280',
        },
        phaseLabel: {
            fontSize: '13px',
            fontWeight: 500,
            color: '#9CA3AF',
            marginTop: '6px',
        },
        frequencyIcon: {
            fontSize: '26px',
            color: '#4B4B4B',
            marginBottom: '12px',
        },
        frequencyValue: {
            fontSize: '26px',
            fontWeight: 700,
            color: '#4B4B4B',
        },
        frequencyUnit: {
            fontSize: '16px',
            fontWeight: 500,
            color: '#6B7280',
        },
        frequencyLabel: {
            fontSize: '14px',
            color: '#9CA3AF',
            marginTop: '6px',
        },
        h2Label: {
            position: 'absolute',
            bottom: '16px',
            right: '20px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#9CA3AF',
        },
        mainContent: {
            width: sidebarVisible ? 'calc(100% - 0px)' : 'calc(100% - 0px)', // Adjust width based on sidebar visibility
            height: '900px',
            // padding: '24px',
            margin: '0 auto',
            fontFamily: 'Inter, Roboto, system-ui, sans-serif',
            overflow: 'hidden',
            transition: 'width 0.3s ease', // Add transition for smooth width change
        },
        sectionTitle: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: '16px',
            display: 'block',
        },
        card: {
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0px 6px 16px rgba(0,0,0,0.08)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        },
        loadCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0px 6px 16px rgba(0,0,0,0.08)',
            height: '112px',
            display: 'flex',
            flexDirection: 'column',
        },
        cardContent: {
            padding: '24px !important',
            height: '100%',
            position: 'relative'
        },
        cardBottomLabel: {
            position: 'absolute',
            bottom: '16px',
            right: '20px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#9E9E9E'
        },
        harmonicsCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0px 6px 16px rgba(0,0,0,0.08)',
            height: '120px',
            display: 'flex',
            flexDirection: 'column',
        },
        chartCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0px 6px 16px rgba(0,0,0,0.08)',
            height: '140px',
            display: 'flex',
            flexDirection: 'column',
        },
        icon: {
            fontSize: '24px',
            color: '#6B7280',
            marginBottom: '6px',
        },
        value: {
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
        },
        unit: {
            fontSize: '14px',
            fontWeight: 500,
            color: '#6B7280',
            marginLeft: '4px',
            alignSelf: 'flex-end',
        },
        chartContainer: {
            flex: 1,
            minHeight: 0,
            marginTop: '8px',
        }
    };

    // Chart configuration for Energy Consumption Trend
    const energyChartOptions = {
        chart: {
            type: "area",
            height: 80,
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: { enabled: false },
            background: "transparent",
        },

        stroke: {
            curve: "smooth",
            width: 2,
            colors: ["#FFFFFF"],
        },

        markers: {
            size: 0,
        },

        grid: {
            show: false,
        },

        xaxis: {
            categories: [
                "14 Nov",
                "15 Nov",
                "16 Nov",
                "17 Nov",
                "18 Nov",
                "19 Nov",
            ],
            labels: {
                style: {
                    colors: "#E5EDFA",
                    fontSize: "12px",
                },
            },
            axisBorder: { show: false },
            axisTicks: { show: true },
        },

        yaxis: {
            min: 100,
            max: 200,
            tickAmount: 3,
            labels: {
                style: {
                    colors: "#E5EDFA",
                    fontSize: "12px",
                },
            },
        },

        tooltip: {
            enabled: true,
            theme: "dark",
        },

        legend: {
            show: false,
        },
    };

    const energyChartSeries = [
        {
            name: "Energy",
            data: [115, 130, 145, 155, 150, 165, 160],
        },
    ];

    // Calculate responsive widths for cards based on sidebar visibility
    const getCardWidths = () => {
        const totalWidth = sidebarVisible ? window.innerWidth - 240 - 48 : window.innerWidth - 60 - 48; // Account for padding
        const voltageCardWidth = Math.min(520, Math.floor(totalWidth * 0.4));
        const frequencyCardWidth = Math.min(280, Math.floor(totalWidth * 0.2));
        const harmonicsCardWidth = Math.min(520, Math.floor(totalWidth * 0.4));
        const chartCardWidth = Math.max(300, totalWidth - (voltageCardWidth * 2) - frequencyCardWidth - 72); // 72px for gaps

        return {
            voltageCardWidth,
            frequencyCardWidth,
            harmonicsCardWidth,
            chartCardWidth
        };
    };

    const cardWidths = getCardWidths();

    return (
        <Box style={styles.mainContent} id="main-content">
            {/* Header */}
            <Box style={styles.blockHeader} className="block-header mb-1">
                    <Grid container>
                      <Grid item lg={5} md={8} xs={12}>
                        <Typography
                          variant="h6"
                          className="logs-title"
                          style={{
                            // marginBottom: '-10px',
                            color: '#0156a6',
                            fontWeight: 600,
                            fontFamily: 'inherit',
                          }}
                        >
                          <span
                            onClick={onSidebarToggle}
                            style={{
                              fontSize: '14px',
                              lineHeight: 1,
                              marginLeft: '-2px',
                              fontWeight: '400',
                              display: 'inline-block',
                              cursor: 'pointer',
                              marginRight: '8px',
                              userSelect: 'none',
                              color: '#007bff'
                            }}
                          >
                            <i className={`fa ${sidebarVisible ? 'fa-arrow-left' : 'fa-arrow-right'}`}></i>
                          </span>
                          Machine 1
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

            {/* Load Specific Information Section */}
            <Typography style={styles.sectionTitle}>Load Specific Information</Typography>
            <Box sx={containerStyle}>
                {/* Card 1: Active Power */}
                <Card sx={cardStyle}>
                    <Box sx={iconContainerStyle}>
                        <SpeedIcon sx={iconStyle} />
                    </Box>
                    <Box sx={contentStyle}>
                        <Typography sx={titleStyle}>Active Power</Typography>
                        <Box sx={valueContainerStyle}>
                            <Typography sx={valueStyle}>1000</Typography>
                        </Box>
                        <Typography sx={unitStyle}>kW</Typography>
                    </Box>
                </Card>

                {/* Card 2: Demand Load */}
                <Card sx={cardStyle}>
                    <Box sx={iconContainerStyle}>
                        <SpeedIcon sx={iconStyle} />
                    </Box>
                    <Box sx={contentStyle}>
                        <Typography sx={titleStyle}>Demand Load</Typography>
                        <Box sx={valueContainerStyle}>
                            <Typography sx={valueStyle}>75.76</Typography>
                        </Box>
                        <Typography sx={unitStyle}>kVA</Typography>
                    </Box>
                </Card>

                {/* Card 3: Power Factor */}
                <Card sx={cardStyle}>
                    <Box sx={iconContainerStyle}>
                        <SpeedIcon sx={iconStyle} />
                    </Box>
                    <Box sx={contentStyle}>
                        <Typography sx={titleStyle}>Power Factor</Typography>
                        <Box sx={valueContainerStyle}>
                            <Typography sx={valueStyle}>0.99</Typography>
                        </Box>
                    </Box>
                </Card>

                {/* Card 4: Max Recorded Energy */}
                <Card sx={cardStyle}>
                    <Box sx={iconContainerStyle}>
                        <SpeedIcon sx={iconStyle} />
                    </Box>
                    <Box sx={contentStyle}>
                        <Typography sx={titleStyle}>Max Recorded Energy</Typography>
                        <Box sx={valueContainerStyle}>
                            <Typography sx={valueStyle}>1000</Typography>
                        </Box>
                        <Typography sx={unitStyle}>kWh</Typography>
                    </Box>
                </Card>

                {/* Card 5: Max Recorded Power */}
                <Card sx={cardStyle}>
                    <Box sx={iconContainerStyle}>
                        <SpeedIcon sx={iconStyle} />
                    </Box>
                    <Box sx={contentStyle}>
                        <Typography sx={titleStyle}>Max Recorded Power</Typography>
                        <Box sx={valueContainerStyle}>
                            <Typography sx={valueStyle}>1000</Typography>
                        </Box>
                        <Typography sx={unitStyle}>kWh</Typography>
                    </Box>
                </Card>
            </Box>

            {/* Power Source Information Section */}
            <Box style={styles.containerStyle}>
                <Typography style={styles.sectionTitle}>Power Source Information</Typography>

                <Box style={styles.cardsContainer}>
                    {/* Voltage Card */}
                    <Card style={{ ...styles.voltageCard, width: cardWidths.voltageCardWidth }}>
                        <CardContent sx={{ padding: 0, height: '100%' }}>
                            <Box style={styles.phaseContainer}>
                                <Box textAlign="center">
                                    <Typography style={styles.phaseValue}>
                                        244.76 <span style={styles.phaseUnit}>v</span>
                                    </Typography>
                                    <Typography style={styles.phaseLabel}>R Phase</Typography>
                                </Box>
                                <Box textAlign="center">
                                    <Typography style={styles.phaseValue}>
                                        244.66 <span style={styles.phaseUnit}>v</span>
                                    </Typography>
                                    <Typography style={styles.phaseLabel}>Y Phase</Typography>
                                </Box>
                                <Box textAlign="center">
                                    <Typography style={styles.phaseValue}>
                                        247.35 <span style={styles.phaseUnit}>v</span>
                                    </Typography>
                                    <Typography style={styles.phaseLabel}>B Phase</Typography>
                                </Box>
                            </Box>
                            <Typography style={styles.h2Label}>Voltage</Typography>
                        </CardContent>
                    </Card>

                    {/* Current Card */}
                    <Card style={{ ...styles.voltageCard, width: cardWidths.voltageCardWidth }}>
                        <CardContent sx={{ padding: 0, height: '100%' }}>
                            <Box style={styles.phaseContainer}>
                                <Box textAlign="center">
                                    <Typography style={styles.phaseValue}>
                                        244.76 <span style={styles.phaseUnit}>v</span>
                                    </Typography>
                                    <Typography style={styles.phaseLabel}>R Phase</Typography>
                                </Box>
                                <Box textAlign="center">
                                    <Typography style={styles.phaseValue}>
                                        244.66 <span style={styles.phaseUnit}>v</span>
                                    </Typography>
                                    <Typography style={styles.phaseLabel}>Y Phase</Typography>
                                </Box>
                                <Box textAlign="center">
                                    <Typography style={styles.phaseValue}>
                                        247.35 <span style={styles.phaseUnit}>v</span>
                                    </Typography>
                                    <Typography style={styles.phaseLabel}>B Phase</Typography>
                                </Box>
                                <Typography style={styles.h2Label}>Current</Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Frequency Card */}
                    <Card style={{ ...styles.frequencyCard, width: cardWidths.frequencyCardWidth }}>
                        <CardContent sx={{ padding: 0, height: '100%' }}>
                            <Box style={styles.frequencyContainer}>
                                <TimelineIcon style={styles.frequencyIcon} />
                                <Typography style={styles.frequencyValue}>
                                    50.15 <span style={styles.frequencyUnit}>v</span>
                                </Typography>
                                <Typography style={styles.frequencyLabel}>Frequency</Typography>
                                <Typography style={styles.h2Label}>H2</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Harmonics Section */}
            <Box style={styles.containerStyle}>
                <Typography style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1F2937',
                    marginBottom: '16px',
                    marginTop: '24px',
                }}>Harmonics</Typography>
                <Box style={{
                    display: 'flex',
                    gap: '24px',
                    width: '100%',
                    flexWrap: 'nowrap'
                }}>
                    {/* Voltage THD Card */}
                    <Card style={{
                        width: cardWidths.harmonicsCardWidth,
                        height: '100px',
                        borderRadius: '18px',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.10)',
                        padding: '22px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box style={{
                                display: 'flex',
                                justifyContent: 'space-around',
                                alignItems: 'center',
                                height: '100%',
                                marginTop: '-20px',
                            }}>
                                <Box textAlign="center">
                                    <Typography style={{
                                        fontSize: '24px',
                                        fontWeight: 700,
                                        color: '#4B4B4B',
                                    }}>&le;5%</Typography>
                                    <Typography style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#9CA3AF',
                                        marginTop: '6px'
                                    }}>R Phase</Typography>
                                </Box>
                                <Box textAlign="center">
                                    <Typography style={{
                                        fontSize: '24px',
                                        fontWeight: 700,
                                        color: '#4B4B4B',
                                    }}>15%</Typography>
                                    <Typography style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#9CA3AF',
                                        marginTop: '6px'
                                    }}>Y Phase</Typography>
                                </Box>
                                <Box textAlign="center">
                                    <Typography style={{
                                        fontSize: '24px',
                                        fontWeight: 700,
                                        color: '#4B4B4B',
                                    }}>15%</Typography>
                                    <Typography style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#9CA3AF',
                                        marginTop: '6px'
                                    }}>B Phase</Typography>
                                </Box>
                            </Box>
                            <Typography style={{
                                position: 'absolute',
                                bottom: '16px',
                                right: '20px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#9E9E9E',
                            }}>Voltage TDH</Typography>
                        </CardContent>
                    </Card>

                    {/* Current THD Card */}
                    <Card style={{
                        width: cardWidths.harmonicsCardWidth,
                        height: '100px',
                        borderRadius: '18px',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.10)',
                        padding: '22px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box style={{
                                display: 'flex',
                                justifyContent: 'space-around',
                                alignItems: 'center',
                                height: '100%',
                                marginTop: '-20px',
                            }}>
                                <Box textAlign="center">
                                    <Typography style={{
                                        fontSize: '24px',
                                        fontWeight: 700,
                                        color: '#4B4B4B',
                                    }}>&le;8%</Typography>
                                    <Typography style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#9CA3AF',
                                        marginTop: '6px'
                                    }}>R Phase</Typography>
                                </Box>
                                <Box textAlign="center">
                                    <Typography style={{
                                        fontSize: '24px',
                                        fontWeight: 700,
                                        color: '#4B4B4B',
                                    }}>7.55%</Typography>
                                    <Typography style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#9CA3AF',
                                        marginTop: '6px'
                                    }}>Y Phase</Typography>
                                </Box>
                                <Box textAlign="center">
                                    <Typography style={{
                                        fontSize: '24px',
                                        fontWeight: 700,
                                        color: '#4B4B4B',
                                    }}>8.00%</Typography>
                                    <Typography style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#9CA3AF',
                                        marginTop: '6px'
                                    }}>B Phase</Typography>
                                </Box>
                            </Box>
                            <Typography style={{
                                position: 'absolute',
                                bottom: '16px',
                                right: '20px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#9E9E9E',
                            }}>Current TDH</Typography>
                        </CardContent>
                    </Card>

                    {/* Energy Consumption Trend Card */}
                    <Card style={{
                        width: cardWidths.chartCardWidth,
                        height: '100px',
                        borderRadius: '18px',
                        background: 'linear-gradient(180deg, #2F6FB0 0%, #2C5E93 100%)',
                        padding: '22px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography style={{
                                color: '#FFFFFF',
                                fontSize: '16px',
                                fontWeight: 600,
                                marginBottom: '8px',
                            }}>Energy Consumption Trend</Typography>
                            <Box style={{
                                flex: 1,
                                minHeight: 0,
                                marginTop: '8px',
                            }}>
                                <Chart
                                    options={{
                                        ...energyChartOptions,
                                        chart: {
                                            ...energyChartOptions.chart,
                                            background: "transparent",
                                        },
                                        stroke: {
                                            curve: "smooth",
                                            width: 2,
                                            colors: ["#FFFFFF"],
                                        },
                                        fill: {
                                            type: "gradient",
                                            gradient: {
                                                colorStops: [
                                                    {
                                                        offset: 0,
                                                        color: "#FFFFFF",
                                                        opacity: 0.35
                                                    },
                                                    {
                                                        offset: 100,
                                                        color: "#FFFFFF",
                                                        opacity: 0.05
                                                    }
                                                ]
                                            }
                                        },
                                        xaxis: {
                                            categories: [
                                                "14 Nov",
                                                "15 Nov",
                                                "16 Nov",
                                                "17 Nov",
                                                "18 Nov",
                                                "19 Nov",
                                            ],
                                            labels: {
                                                style: {
                                                    colors: "rgba(255,255,255,0.85)",
                                                    fontSize: "12px",
                                                },
                                            },
                                            axisBorder: { show: false },
                                            axisTicks: { show: false },
                                        },
                                        yaxis: {
                                            min: 100,
                                            max: 200,
                                            tickAmount: 3,
                                            labels: {
                                                style: {
                                                    colors: "rgba(255,255,255,0.85)",
                                                    fontSize: "12px",
                                                },
                                            },
                                        },
                                    }}
                                    series={energyChartSeries}
                                    type="line"
                                    height={80}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
};

export default EquipmentInsight; 