import api from "./axios";

export const getAllEmployees = async () => {
  const response = await api.get(`/employees`);
  return response.data;
};

export const updateLeaveBalance = async (id, paid, sick) => {
  const response = await api.put(`/employees/${id}/leave-balance`, { paid: Number(paid), sick: Number(sick) });
  return response.data;
};
