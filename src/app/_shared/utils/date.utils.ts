export const addMonths = (date: Date, months: number) => {
    let d = new Date(date);
    let day = d.getDate();

    d.setMonth(d.getMonth() + months);

    if (d.getDate() < day) {
        d.setDate(0);
    }

    return d;
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

export const formatDateString = (date: Date) => {
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
  }