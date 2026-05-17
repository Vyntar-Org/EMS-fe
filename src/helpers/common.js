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
