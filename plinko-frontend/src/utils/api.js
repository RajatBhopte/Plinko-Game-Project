import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const commitRound = async () => {
  const { data } = await api.post("/api/rounds/commit");
  return data;
};

export const startRound = async (roundId, clientSeed, betCents, dropColumn) => {
  const { data } = await api.post(`/api/rounds/${roundId}/start`, {
    clientSeed,
    betCents,
    dropColumn,
  });
  return data;
};

export const revealRound = async (roundId) => {
  const { data } = await api.post(`/api/rounds/${roundId}/reveal`);
  return data;
};

export const getRound = async (roundId) => {
  const { data } = await api.get(`/api/rounds/${roundId}`);
  return data;
};

// NEW: Real verification by round ID
export const verifyRound = async (
  serverSeed,
  clientSeed,
  nonce,
  dropColumn,
) => {
  const { data } = await api.get("/api/verify", {
    params: { serverSeed, clientSeed, nonce, dropColumn },
  });
  return data;
};

// Public calculator (manual verification)
export const calculateRound = async (
  serverSeed,
  clientSeed,
  nonce,
  dropColumn,
) => {
  const { data } = await api.get("/api/verify", {
    params: { serverSeed, clientSeed, nonce, dropColumn },
  });
  return data;
};
