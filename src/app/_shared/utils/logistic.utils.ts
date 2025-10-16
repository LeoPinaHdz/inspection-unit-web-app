export const formatDateString = (date: Date | null): string => {
    if (!date) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

export const addYears = (date: Date, years: number) => {
    let d = new Date(date);
    let day = d.getDate();

    d.setFullYear(d.getFullYear() + years);

    if (d.getDate() < day) {
        d.setDate(0);
    }

    return d;
}