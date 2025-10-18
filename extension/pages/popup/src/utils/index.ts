export const convertTimestamp = (tstr: string) => {
  const date = new Date(tstr);
  const formatted = date
    .toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-")
    .replace(/,/, "");
  const unix = Math.floor(date.getTime() / 1000);
  return { formatted, unix };
};

export const isValidSuiPackageId = (input: string) => {
  const suiPackageIdRegex = /^(0x|0X)?[a-fA-F0-9]{1,64}$/;
  return suiPackageIdRegex.test(input);
};
