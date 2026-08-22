import api from "./axios";

export const getSalary = async (employeeId) => {
  const response = await api.get(`/salary/${employeeId}`);
  return response.data;
};

export const updateSalary = async (employeeId, data) => {
  const response = await api.put(`/salary/${employeeId}`, data);
  return response.data;
};
