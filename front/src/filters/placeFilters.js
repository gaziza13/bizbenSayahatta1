import { normalizePriceTier } from "../utils/placeUtils";

export const filterByPrice = (list, priceFilter) => {
  if (priceFilter === "all") return list;
  return list.filter((p) => normalizePriceTier(p.price_level) === priceFilter);
};

export const filterByDate = (list, dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return list;

  return list.filter((p) => {
    if (!p.created_at) return true;
    const placeDate = new Date(p.created_at);
    if (dateFrom && placeDate < new Date(dateFrom)) return false;
    if (dateTo && placeDate > new Date(dateTo)) return false;
    return true;
  });
};
