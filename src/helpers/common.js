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
