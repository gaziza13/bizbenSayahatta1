// функция что б сделать лист 
export function toList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}
// нормализирует для фильтрации цены
export function normalizePriceTier(priceLevel) {
    if (priceLevel === null || priceLevel === undefined || priceLevel === "") {
        return "unknown";
    }

    const value = String(priceLevel).toUpperCase();
    if (value === "0" || value.includes("FREE")) return "free";
    if (value === "1" || value.includes("INEXPENSIVE")) return "budget";
    if (value === "2" || value.includes("MODERATE")) return "moderate";
    if (
        value === "3" ||
        value === "4" ||
        value.includes("EXPENSIVE") ||
        value.includes("VERY_EXPENSIVE")
    ) {
        return "premium";
    }
    return "unknown";
}
// наименование для цен
export function priceTierLabel(priceLevel) {
    const tier = normalizePriceTier(priceLevel);
    if (tier === "free") return "🆓";
    if (tier === "budget") return "🪙";
    if (tier === "moderate") return "💸";
    if (tier === "premium") return "💰";
    return "Unknown";
}

// форматирование категории 
export const formatCategory = (categoryValue) => {
    if (!categoryValue) return "";
    return categoryValue
        .replace("_", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
};

// форматирование локации 
export const formatLocation = (place) => {
    const city = (place.city || "").trim();
    let country = (place.country || "").trim();

    if (!country || country.toLowerCase() === city.toLowerCase()) {
        const address = (place.address || "").trim();
        const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
        const maybeCountry = parts[parts.length - 1];
        if (maybeCountry && maybeCountry.toLowerCase() !== city.toLowerCase()) {
            country = maybeCountry;
        }
    }

    if (city && country) return `${city}, ${country}`;
    return city || country || "";
};

export const computeDurationDays = (start, end, fallbackDays = 1) => {
    if (!start || !end) return Number(fallbackDays) || 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return Number(fallbackDays) || 1;
    }
    const diffMs = endDate.getTime() - startDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, days);
};
