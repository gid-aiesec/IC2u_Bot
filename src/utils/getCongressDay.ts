export const getCongressDay = () => {
    const congressStartDate = new Date("2025-07-04T00:00:00+05:30");
    const now = new Date();

    const diffInMs = now.getTime() - congressStartDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;

    return diffInDays;
};

export const getAdjustedCongressDay = () => {
    const day = getCongressDay();
    const colomboNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }));

    if (colomboNow.getHours() < 9) {
        return day - 1;
    }
    return day;
};
