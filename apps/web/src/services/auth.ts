const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

export function getGoogleLoginUrl() {
    return `${API_BASE_URL}/auth/google`
}
export function getGithubLoginUrl() {
    return `${API_BASE_URL}/auth/github`
}
export function saveAuthTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
}
export function getAccessToken() {
    return localStorage.getItem('accessToken');
}
export function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}
export function clearAuthTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}