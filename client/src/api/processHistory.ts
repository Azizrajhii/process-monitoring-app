import { api } from './http';

export async function fetchProcessHistory(processId: string) {
  const res = await api.get(`/processes/${processId}/history`);
  return res.data.history;
}

export async function compareProcessVersions(processId: string, v1: number, v2: number) {
  const res = await api.get(`/processes/${processId}/compare`, { params: { v1, v2 } });
  return res.data;
}
