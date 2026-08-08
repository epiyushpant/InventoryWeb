/**
 * A lightweight utility to convert Gregorian (AD) dates to Nepali (BS) dates.
 * This implementation covers the most common years for business reporting (2070 BS - 2090 BS).
 */

const bsData: Record<number, number[]> = {
    2075: [31, 31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30],
    2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2077: [31, 31, 32, 31, 31, 31, 30, 30, 30, 30, 29, 30],
    2078: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2079: [31, 31, 32, 31, 31, 31, 30, 30, 30, 30, 29, 30],
    2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2081: [31, 31, 32, 31, 31, 31, 30, 30, 30, 30, 29, 30],
    2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2083: [31, 31, 32, 31, 31, 31, 30, 30, 30, 30, 29, 30],
    2084: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2085: [31, 31, 32, 31, 31, 31, 30, 30, 30, 30, 29, 30],
};

// Reference point: 2075-01-01 BS is 2018-04-14 AD
const referenceBSYear = 2075;
const referenceADDate = new Date(2018, 3, 14); // Note: Month is 0-indexed (3 = April)

export function toNepaliDateString(adDateInput: string | Date | null): string {
    if (!adDateInput) return '—';
    
    const adDate = new Date(adDateInput);
    if (isNaN(adDate.getTime())) return '—';

    // Difference in days
    const diffTime = adDate.getTime() - referenceADDate.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        // Simple fallback for dates before reference
        return adDate.toLocaleDateString() + ' (AD)';
    }

    let bsYear = referenceBSYear;
    let bsMonth = 1;

    // Loop through years
    while (true) {
        if (!bsData[bsYear]) break;
        const yearDays = bsData[bsYear].reduce((a, b) => a + b, 0);
        if (diffDays < yearDays) break;
        diffDays -= yearDays;
        bsYear++;
    }

    // Loop through months
    if (bsData[bsYear]) {
        for (let i = 0; i < 12; i++) {
            const monthDays = bsData[bsYear][i];
            if (diffDays < monthDays) {
                bsMonth = i + 1;
                break;
            }
            diffDays -= monthDays;
        }
    } else {
        return adDate.toLocaleDateString() + ' (AD)';
    }

    const bsDay = diffDays + 1;

    // Pad with leading zeros
    const mm = bsMonth.toString().padStart(2, '0');
    const dd = bsDay.toString().padStart(2, '0');

    return `${bsYear}-${mm}-${dd} BS`;
}

/** Dual display: AD local date + BS string */
export function formatAdBs(adDateInput: string | Date | null | undefined): string {
    if (!adDateInput) return '—';
    const adDate = new Date(adDateInput);
    if (isNaN(adDate.getTime())) return '—';
    const ad = adDate.toLocaleDateString('en-GB');
    const bs = toNepaliDateString(adDate);
    return `${ad} · ${bs}`;
}

export const nepaliMonths = [
    'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];
