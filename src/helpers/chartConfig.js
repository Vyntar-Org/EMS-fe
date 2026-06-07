export const CHART_COLORS = {
  primary: "#0156A6",
  secondary: "#A5AAB5",
  online: "#28A745",
  offline: "#DC3545",
  warning: "#F1B44C",
  danger: "#F46A6A",
  success: "#34C38F",
  purple: "#6F42C1",
  orange: "#FD7E14",
  teal: "#20C997",
};

const DEFAULT_COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary];

const LARGE_DATA_THRESHOLD = 500;

const downsample = (data, maxPoints = 100) => {
  if (!Array.isArray(data) || data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
};

const getCategories = (data) =>
  Array.isArray(data)
    ? data.map((item) => {
        const d = new Date(item.date);
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      })
    : [];

const commonXAxis = (data, isLarge, xLabel = "Day") => ({
  categories: getCategories(data),
  title: {
    text: xLabel,
    style: { color: "#555", fontWeight: "bold" },
  },
  axisBorder: { show: false },
  axisTicks: { show: false },
  labels: {
    rotate: -45,
    style: { colors: "#757575", fontSize: "11px" },
    formatter: isLarge ? (val, i) => (i % 5 === 0 ? val : "") : undefined,
  },
  tickAmount: isLarge ? 20 : undefined,
});

const commonYAxis = (yLabel = "Liters") => ({
  title: {
    text: yLabel,
    style: { color: "#555", fontWeight: "bold" },
  },
  axisBorder: { show: false },
  axisTicks: { show: false },
  labels: {
    style: { colors: "#757575" },
    formatter: (val) => Math.round(val),
  },
});

const commonLegend = {
  show: true,
  position: "top",
  horizontalAlign: "center",
  markers: { shape: "square", size: 10 },
};

const commonTooltip = (yLabel = "Liters") => ({
  shared: true,
  intersect: false,
  followCursor: true,
  y: { formatter: (val) => `${val} ${yLabel}` },
});

const commonGrid = {
  borderColor: "rgba(0,0,0,0.06)",
  yaxis: { lines: { show: true } },
  xaxis: { lines: { show: false } },
};

const commonChart = (type, isLarge) => ({
  type,
  toolbar: { show: false },
  zoom: { enabled: false },
  animations: {
    enabled: !isLarge,
    speed: 400,
    dynamicAnimation: { enabled: !isLarge },
  },
  redrawOnParentResize: true,
  redrawOnWindowResize: true,
});

const barOptions = (data, isLarge, yLabel, xLabel, colors) => ({
  chart: commonChart("bar", isLarge),
  colors,
  plotOptions: {
    bar: {
      borderRadius: isLarge ? 0 : 4,
      borderRadiusApplication: "end",
      columnWidth: isLarge ? "90%" : "75%",
      dataLabels: { position: "top" },
    },
  },
  stroke: {
    show: true,
    width: 2,
    colors: ["transparent"],
  },
  markers: { size: 0 },
  dataLabels: { enabled: false },
  xaxis: commonXAxis(data, isLarge, xLabel),
  yaxis: commonYAxis(yLabel),
  tooltip: commonTooltip(yLabel),
  legend: commonLegend,
  grid: commonGrid,
});

const lineOptions = (data, isLarge, yLabel, xLabel, colors) => ({
  chart: commonChart("line", isLarge),
  colors,
  plotOptions: { bar: { enabled: false } },
  stroke: {
    curve: isLarge ? "straight" : "straight",
    width: [2, 2],
    dashArray: [0, 6],
  },
  markers: {
    size: isLarge ? 0 : 5,
    shape: "circle",
    strokeWidth: 0,
    hover: { size: isLarge ? 3 : 7 },
  },
  dataLabels: { enabled: false },
  xaxis: commonXAxis(data, isLarge, xLabel),
  yaxis: commonYAxis(yLabel),
  tooltip: commonTooltip(yLabel),
  legend: commonLegend,
  grid: commonGrid,
});

const areaOptions = (data, isLarge, yLabel, xLabel, colors) => ({
  chart: commonChart("area", isLarge),
  colors,
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: isLarge ? 0 : 1,
      opacityFrom: isLarge ? 0.2 : 0.4,
      opacityTo: 0.05,
    },
  },
  stroke: {
    curve: "straight",
    width: [2, 2],
    dashArray: [0, 6],
  },
  markers: { size: isLarge ? 0 : 4, strokeWidth: 0 },
  dataLabels: { enabled: false },
  xaxis: commonXAxis(data, isLarge, xLabel),
  yaxis: commonYAxis(yLabel),
  tooltip: commonTooltip(yLabel),
  legend: commonLegend,
  grid: commonGrid,
});

const donutOptions = (labels = [], yLabel = "", colors) => ({
  chart: {
    type: "donut",
    toolbar: { show: false },
    animations: { enabled: true, speed: 400 },
  },
  colors,
  labels,
  dataLabels: {
    enabled: true,
    formatter: (val) => `${Math.round(val)}%`,
  },
  plotOptions: {
    pie: {
      donut: {
        size: "65%",
        labels: {
          show: true,
          total: {
            show: true,
            label: yLabel || "Total",
            formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0),
          },
        },
      },
    },
  },
  legend: { ...commonLegend, position: "bottom" },
  tooltip: {
    y: { formatter: (val) => `${val} ${yLabel}` },
  },
});

const radialOptions = (labels = [], colors) => ({
  chart: {
    type: "radialBar",
    toolbar: { show: false },
    animations: { enabled: true, speed: 400 },
  },
  colors,
  plotOptions: {
    radialBar: {
      offsetY: 0,
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
  labels,
  legend: {
    show: false,
  },
  stroke: {
    lineCap: "round",
  },
  tooltip: {
    enabled: true,
    y: { formatter: (val) => `${Math.round(val)}%` },
  },
});

/**
 * @param {"bar"|"line"|"area"|"donut"|"radialBar"} type
 * @param {Array} data  - raw API data array
 * @param {Object} opts - { yLabel, xLabel, labels, maxPoints, colors }
 * @author Venkadesan
 */
export const getChartOptions = (type, data, opts = {}) => {
  const {
    yLabel = "Liters",
    xLabel = "Day",
    labels = [],
    maxPoints = 100,
    colors = DEFAULT_COLORS,
  } = opts;

  const isLarge = Array.isArray(data) && data.length > LARGE_DATA_THRESHOLD;

  switch (type) {
    case "bar":
      return barOptions(data, isLarge, yLabel, xLabel, colors);
    case "line":
      return lineOptions(data, isLarge, yLabel, xLabel, colors);
    case "area":
      return areaOptions(data, isLarge, yLabel, xLabel, colors);
    case "donut":
      return donutOptions(labels, yLabel, colors);
    case "radialBar":
      return radialOptions(labels, colors);
    default:
      return lineOptions(data, isLarge, yLabel, xLabel, colors);
  }
};

/**
 * @param {Array}  data       - raw API data array
 * @param {Object} seriesMap  - { actual: "fieldName", target: "fieldName" }
 * @param {number} maxPoints  - downsample limit for large data
 * @author Venkadesan
 */
export const getChartSeries = (data, seriesMap = {}, maxPoints = 100) => {
  const {
    actual = "consumption",
    target = "target",
    actualLabel = "Actual Consumption",
    targetLabel = "Target",
  } = seriesMap;

  const sampled = downsample(data, maxPoints);

  return [
    {
      name: actualLabel,
      data: Array.isArray(sampled)
        ? sampled.map((item) => item[actual] ?? 0)
        : [],
    },
    {
      name: targetLabel,
      data: Array.isArray(sampled)
        ? sampled.map((item) => item[target] ?? 0)
        : [],
    },
  ];
};
