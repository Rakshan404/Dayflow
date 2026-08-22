import api from "./axios";

export const getAttendance = async (employeeId) => {
  const res = await api.get(`/attendance/${employeeId}`);
  return res.data;
};

export const getAdminAttendance = async () => {
  const res = await api.get(`/attendance/today/all`);
  return res.data;
};

export const checkIn = async () => {
  const res = await api.post("/attendance/checkin");
  return res.data;
};

export const checkOut = async () => {
  const res = await api.post("/attendance/checkout");
  return res.data;
};
