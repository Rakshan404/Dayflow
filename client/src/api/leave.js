import api from "./axios";

export const getLeaveBalance = async () => {
  const response = await api.get("/leave/balance");
  return response.data;
};

export const getMyLeaves = async () => {
  const response = await api.get("/leave");
  return response.data;
};

export const createLeave = async (payload) => {
  const response = await api.post("/leave", payload);
  return response.data;
};

export const approveLeave = async (id, adminComment) => {
  const response = await api.put(`/leave/${id}/approve`, { adminComment });
  return response.data;
};

export const rejectLeave = async (id, adminComment) => {
  const response = await api.put(`/leave/${id}/reject`, { adminComment });
  return response.data;
};
