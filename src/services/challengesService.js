/**
 * challengesService - Thử thách tiết kiệm. BE: /api/v1/challenges
 *
 * Lưu ý mô hình: BE chỉ lưu name/targetAmountVnd/startDate/endDate + tiến độ
 * (currentAmountVnd, streakDays) cập nhật qua check-in. Các field UI bổ sung
 * (description, dailyTarget, type) không được BE lưu.
 *   FE title <-> BE name; FE targetAmount/currentAmount <-> *Vnd
 */
import apiClient from "./apiClient";

const today = () => new Date().toISOString().slice(0, 10);

function mapChallenge(c) {
  if (!c) return null;
  return {
    ...c,
    title: c.name,
    description: c.description || "",
    targetAmount: Number(c.targetAmountVnd ?? 0),
    currentAmount: Number(c.currentAmountVnd ?? 0),
    streakDays: Number(c.streakDays ?? 0),
  };
}

export const getChallenges = async (ledgerId, status) => {
  const data = await apiClient.get("/challenges", {
    query: { ledgerId, ...(status ? { status } : {}) },
  });
  return (data.challenges || []).map(mapChallenge);
};

export const createChallenge = async (ledgerId, challengeData) => {
  const payload = {
    ledgerId,
    name: challengeData.title || challengeData.name,
    startDate: challengeData.startDate,
    endDate: challengeData.endDate,
  };
  if (challengeData.targetAmount) {
    payload.targetAmountVnd = Math.round(Number(challengeData.targetAmount));
  }
  const data = await apiClient.post("/challenges", payload);
  return mapChallenge(data.challenge);
};

export const updateChallenge = async (challengeId, updates) => {
  const payload = {};
  if (updates.title !== undefined) payload.name = updates.title;
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.targetAmount !== undefined)
    payload.targetAmountVnd = Math.round(Number(updates.targetAmount));
  if (updates.startDate !== undefined) payload.startDate = updates.startDate;
  if (updates.endDate !== undefined) payload.endDate = updates.endDate;
  if (updates.status !== undefined) payload.status = updates.status;
  const data = await apiClient.patch(`/challenges/${challengeId}`, payload);
  return mapChallenge(data.challenge);
};

/** Check-in một ngày cho thử thách (cộng tiến độ + streak). */
export const checkInChallenge = async (challengeId, amount, checkinDate, note) => {
  const data = await apiClient.post(`/challenges/${challengeId}/checkins`, {
    checkinDate: checkinDate || today(),
    amountVnd: Math.round(Number(amount || 0)),
    ...(note ? { note } : {}),
  });
  return data;
};

export const deleteChallenge = async (challengeId) => {
  const data = await apiClient.delete(`/challenges/${challengeId}`);
  return mapChallenge(data.challenge);
};
