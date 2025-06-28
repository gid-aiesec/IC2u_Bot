const CONGRESS_START_DATE = new Date("2025-06-28");

export const getCongressDay = () => {
    const now = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
    const nowDate = new Date(now);

    const diffTime = nowDate.getTime() - CONGRESS_START_DATE.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1;
};
