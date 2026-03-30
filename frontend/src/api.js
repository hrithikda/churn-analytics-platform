import axios from "axios"

export const fetchHighRisk = (limit = 100) => api.get(`/api/high-risk-customers?limit=${limit}`).then(r => r.data)

const api = axios.create({ baseURL: "" })

export const fetchKPIs = () => api.get("/api/kpis").then(r => r.data)
export const fetchCohorts = () => api.get("/api/cohorts").then(r => r.data)
export const fetchSegment = (seg) => api.get(`/api/churn-by-segment?segment=${seg}`).then(r => r.data)
export const fetchFeatureImportance = () => api.get("/api/feature-importance").then(r => r.data)
export const fetchModelMetrics = () => api.get("/api/model-metrics").then(r => r.data)