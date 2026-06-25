/**
 * ledgerApi - Sổ thu chi (ledgers). Thay thế cho localStorage + settings doc cũ.
 * BE: /api/v1/ledgers
 */
import apiClient from "./apiClient";

/** @returns {Promise<Array<{id,name,isDefault}>>} */
export const listLedgers = async () => {
  const data = await apiClient.get("/ledgers");
  return data.ledgers || [];
};

export const createLedger = async (name) => {
  const data = await apiClient.post("/ledgers", { name });
  return data.ledger;
};

export const updateLedger = async (id, name) => {
  const data = await apiClient.patch(`/ledgers/${id}`, { name });
  return data.ledger;
};

export const deleteLedger = async (id) => {
  const data = await apiClient.delete(`/ledgers/${id}`);
  return data.ledger;
};
