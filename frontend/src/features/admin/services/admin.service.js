import axios from 'axios';

const adminApi = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const request = async (method, url, payload) => {
  try {
    const response = await adminApi({ method, url, data: payload });
    return response.data;
  } catch (error) {
    const data = error.response?.data;
    const validationMessage = data?.errors?.map(({ msg }) => msg).join(' ');
    throw new Error(
      validationMessage || data?.message || (error.response?.status === 500 ? 'Internal server error.' : 'Request failed.'),
      { cause: error }
    );
  }
};

export const createIntern = (payload) => request('post', '/api/admin/create-intern', payload);
export const createTeamLeader = (payload) => request('post', '/api/admin/create-tl', payload);

// Intern Management API
export const getAllInterns = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  const qs = query.toString() ? `?${query.toString()}` : '';
  return request('get', `/api/admin/interns${qs}`);
};
export const getInternById = (id) => request('get', `/api/admin/interns/${id}`);
export const updateIntern = (id, payload) => request('patch', `/api/admin/interns/${id}`, payload);
export const assignInternTeamLeader = (id, teamLeaderId) => request('patch', `/api/admin/interns/${id}/assignment`, { teamLeaderId });

// Team Leader Management API
export const getAllTeamLeaders = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  const qs = query.toString() ? `?${query.toString()}` : '';
  return request('get', `/api/admin/teamleaders${qs}`);
};
export const getTeamLeaderById = (id) => request('get', `/api/admin/teamleaders/${id}`);
export const updateTeamLeader = (id, payload) => request('patch', `/api/admin/teamleaders/${id}`, payload);
export const getInternsByTeamLeader = (id) => request('get', `/api/admin/teamleaders/${id}/interns`);
export const getForwardedRequests = () => request('get', '/api/admin/forwarded-requests');
export const finalizeRequest = (id, action, rejectionReason) => request(
  'patch',
  `/api/admin/requests/${id}/finalize`,
  action === 'reject' ? { action, rejectionReason } : { action }
);
export const getCertificateDraft = (id) => request('get', `/api/admin/certificates/${id}`);
export const updateCertificateDraft = (id, htmlContent) => request('patch', `/api/admin/certificates/${id}`, { htmlContent });
export const finalizeCertificate = (id) => request('post', `/api/admin/certificates/${id}/finalize`);
export const revokeCertificate = (id, reason) => request('patch', `/api/admin/certificates/${id}/revoke`, { reason });
export const unrevokeCertificate = (id) => request('patch', `/api/admin/certificates/${id}/unrevoke`);

// Day 5 Admin Overview & Retry Generation
export const getAllCertificates = () => request('get', '/api/admin/certificates');
export const retryCertificateGeneration = (id) => request('post', `/api/admin/requests/${id}/retry-generation`);
export const downloadAdminCertificate = async (id, fileName) => {
  const response = await adminApi.get(`/api/admin/certificates/${id}/download`, {
    responseType: 'blob'
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName || 'certificate.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
// Aliases used by CertificatesOverview.jsx
export const revokeAdminCertificate = revokeCertificate;
export const unrevokeAdminCertificate = unrevokeCertificate;

// Certificate templates
export const getCertificateTemplates = () => request('get', '/api/admin/templates');
export const getTemplatePlaceholders = () => request('get', '/api/admin/templates/placeholders');
export const createCertificateTemplate = (payload) => request('post', '/api/admin/templates', payload);
export const updateCertificateTemplate = (id, payload) => request('patch', `/api/admin/templates/${id}`, payload);
// Retention policy
export const getRetentionPolicy = () => request('get', '/api/admin/retention-policy');
export const updateRetentionPolicy = (payload) => request('patch', '/api/admin/retention-policy', payload);

// Archived interns
export const getArchivedInterns = () => request('get', '/api/admin/interns/archived');
export const restoreIntern = (id) => request('patch', `/api/admin/interns/${id}/restore`);

// Audit logs
const toQuery = (params = {}) => {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return q ? `?${q}` : '';
};

export const getAuditLogs = (params = {}) =>
  request('get', `/api/admin/audit-logs${toQuery(params)}`);

// Returns a Blob (the page turns it into a CSV download)
export const exportAuditLogs = async (params = {}) => {
  const response = await fetch(`/api/admin/audit-logs/export${toQuery(params)}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Unable to export audit logs (${response.status}).`);
  }
  return response.blob();
};