const NPR_FORMATTER = new Intl.NumberFormat("en-NP", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});

export const formatNpr = (value?: number | null, fallback = "रु 0") => {
  if (value == null || Number.isNaN(value)) return fallback;
  return NPR_FORMATTER.format(value);
};

