import dayjs from "dayjs";

export const formatTimestamp = (tsString) => {
  if (!tsString) return "";
  const dateObj = new Date(tsString);

  const datePart = dateObj.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timePart = dateObj
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  return `${datePart}, ${timePart}`;
};

export const downAnalyticsSampleData = (data, threshold, key) => {
  if (!data || data.length <= threshold) return data;

  const sampled = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  sampled[0] = data[0];

  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0,
      avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    let avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    avgRangeEnd = avgRangeEnd < data.length ? avgRangeEnd : data.length;

    const avgRangeLength = avgRangeEnd - avgRangeStart;
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += j;
      avgY += Number(data[j][key]) || 0;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    let rangeStart = Math.floor(i * bucketSize) + 1;
    let rangeEnd = Math.floor((i + 1) * bucketSize) + 1;

    const pointA_X = a;
    const pointA_Y = Number(data[a][key]) || 0;

    let maxArea = -1;
    let nextA = rangeStart;

    for (let j = rangeStart; j < rangeEnd; j++) {
      const area =
        Math.abs(
          (pointA_X - avgX) * ((Number(data[j][key]) || 0) - pointA_Y) -
            (pointA_X - j) * (avgY - pointA_Y),
        ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        nextA = j;
      }
    }

    sampled[i + 1] = data[nextA];
    a = nextA;
  }

  sampled[threshold - 1] = data[data.length - 1];
  return sampled;
};

export const basePickerStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "#f9f9f9",
    transition: "0.3s",
    "&:hover": {
      backgroundColor: "#fff",
    },
  },
};

export const transformDynamicDataToDailyMatrix = (
  apiData,
  keyConfig = { dateKey: "date", valueKey: "consumption" },
) => {
  const { dateKey, valueKey } = keyConfig;

  if (!apiData || typeof apiData !== "object" || Array.isArray(apiData)) {
    return { tableData: [], tableColumns: [] };
  }

  const monthLookup = [
    "",
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

  const uniqueDates = new Set();
  Object.values(apiData).forEach((dataArray) => {
    if (Array.isArray(dataArray)) {
      dataArray.forEach((item) => {
        if (item && item[dateKey] !== undefined && item[dateKey] !== null) {
          uniqueDates.add(String(item[dateKey]).trim());
        }
      });
    }
  });

  const sortedDates = Array.from(uniqueDates).sort((a, b) => {
    if (!isNaN(a) && !isNaN(b)) {
      return Number(a) - Number(b);
    }
    return dayjs(a).diff(dayjs(b));
  });

  const tableColumns = [
    {
      accessorKey: "device",
      header: "Device",
      size: 160,
    },
    ...sortedDates.map((dateString) => {
      let headerLabel = dateString;

      const isFullDate = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
      const isMonthOnlyString = /^\d{4}-\d{2}$/.test(dateString);
      const isRawNumber =
        !isNaN(dateString) &&
        Number(dateString) >= 1 &&
        Number(dateString) <= 12;

      if (isFullDate) {
        headerLabel = dayjs(dateString).format("DD MMM YYYY");
      } else if (isMonthOnlyString) {
        headerLabel = dayjs(dateString).format("MMM YYYY");
      } else if (isRawNumber) {
        headerLabel = monthLookup[Number(dateString)];
      } else {
        const parsed = dayjs(dateString);
        if (parsed.isValid()) {
          headerLabel = parsed.format("MMM YYYY");
        }
      }

      return {
        accessorKey: dateString,
        header: headerLabel,
        size: isFullDate ? 110 : 100,
        cell: (info) => {
          const val = info.getValue();
          return val !== undefined && val !== null
            ? Number(val).toFixed(2)
            : "0.00";
        },
      };
    }),
  ];

  const tableData = Object.entries(apiData).map(([deviceName, dataArray]) => {
    const row = { device: deviceName };

    sortedDates.forEach((dateStr) => {
      row[dateStr] = 0;
    });

    if (Array.isArray(dataArray)) {
      dataArray.forEach((item) => {
        const itemDate =
          item?.[dateKey] !== undefined ? String(item[dateKey]).trim() : null;
        const itemValue = item?.[valueKey];

        if (itemDate && row.hasOwnProperty(itemDate)) {
          row[itemDate] = parseFloat(Number(itemValue || 0).toFixed(2));
        }
      });
    }

    return row;
  });

  return { tableData, tableColumns };
};

export const triggerFileDownload = (
  downloadUrl,
  preferredFileName = "Download",
) => {
  if (!downloadUrl) return;

  const link = document.createElement("a");
  link.href = downloadUrl;

  link.setAttribute("download", preferredFileName);

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
};
