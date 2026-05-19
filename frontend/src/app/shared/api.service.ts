import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Match, Prediction, Team, RankingEntry, TeamStanding, DashboardStats } from './models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Teams
  getTeams(): Observable<ApiResponse<Team[]>> {
    return this.http.get<ApiResponse<Team[]>>(`${this.api}/teams`);
  }

  // Matches
  getMatches(phase?: string, group?: string): Observable<ApiResponse<Match[]>> {
    let params = new HttpParams();
    if (phase) params = params.set('phase', phase);
    if (group) params = params.set('group', group);
    return this.http.get<ApiResponse<Match[]>>(`${this.api}/matches`, { params });
  }

  getMatch(id: string): Observable<ApiResponse<Match>> {
    return this.http.get<ApiResponse<Match>>(`${this.api}/matches/${id}`);
  }

  createMatch(data: any): Observable<ApiResponse<Match>> {
    return this.http.post<ApiResponse<Match>>(`${this.api}/matches`, data);
  }

  updateMatch(id: string, data: any): Observable<ApiResponse<Match>> {
    return this.http.patch<ApiResponse<Match>>(`${this.api}/matches/${id}`, data);
  }

  deleteMatch(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.api}/matches/${id}`);
  }

  registerResult(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/matches/${id}/result`, data);
  }

  getMatchPredictions(id: string): Observable<ApiResponse<Prediction[]>> {
    return this.http.get<ApiResponse<Prediction[]>>(`${this.api}/matches/${id}/predictions`);
  }

  generateBracket(data: any): Observable<ApiResponse<Match[]>> {
    return this.http.post<ApiResponse<Match[]>>(`${this.api}/matches/bracket/generate`, data);
  }

  // Predictions
  getMyPredictions(phase?: string, group?: string): Observable<ApiResponse<Prediction[]>> {
    let params = new HttpParams();
    if (phase) params = params.set('phase', phase);
    if (group) params = params.set('group', group);
    return this.http.get<ApiResponse<Prediction[]>>(`${this.api}/predictions`, { params });
  }

  getMyPredictionForMatch(matchId: string): Observable<ApiResponse<Prediction | null>> {
    return this.http.get<ApiResponse<Prediction | null>>(`${this.api}/predictions/match/${matchId}`);
  }

  createPrediction(data: { matchId: string; predictedHome: number; predictedAway: number }): Observable<ApiResponse<Prediction>> {
    return this.http.post<ApiResponse<Prediction>>(`${this.api}/predictions`, data);
  }

  updatePrediction(matchId: string, data: { predictedHome: number; predictedAway: number }): Observable<ApiResponse<Prediction>> {
    return this.http.patch<ApiResponse<Prediction>>(`${this.api}/predictions/match/${matchId}`, data);
  }

  // Tournament Predictions Extras
  getTournamentPrediction(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/predictions/tournament`);
  }

  saveTournamentPrediction(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/predictions/tournament`, data);
  }

  downloadTournamentPredictionsExcel(): Observable<Blob> {
    return this.http.get(`${this.api}/reports/tournament/excel`, { responseType: 'blob' });
  }

  // Ranking
  getRanking(page: number = 1, limit: number = 20, phase?: string, search?: string): Observable<ApiResponse<{ rankings: RankingEntry[]; total: number; page: number; totalPages: number }>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (phase) params = params.set('phase', phase);
    if (search) params = params.set('search', search);
    return this.http.get<any>(`${this.api}/ranking`, { params });
  }

  getMyPosition(): Observable<ApiResponse<{ position: number; totalPoints: number; totalUsers: number }>> {
    return this.http.get<any>(`${this.api}/ranking/me`);
  }

  // Groups
  getAllGroupStandings(): Observable<ApiResponse<Record<string, TeamStanding[]>>> {
    return this.http.get<ApiResponse<Record<string, TeamStanding[]>>>(`${this.api}/groups`);
  }

  getGroupStandings(group: string): Observable<ApiResponse<TeamStanding[]>> {
    return this.http.get<ApiResponse<TeamStanding[]>>(`${this.api}/groups/${group}`);
  }

  markQualified(group: string, teamIds: string[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/groups/${group}/qualify`, { teamIds });
  }

  // Profile
  getProfile(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/users/profile`);
  }

  updateProfile(data: { fullName?: string; username?: string }): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/users/profile`, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/users/change-password`, data);
  }

  getPredictionHistory(phase?: string): Observable<ApiResponse<Prediction[]>> {
    let params = new HttpParams();
    if (phase) params = params.set('phase', phase);
    return this.http.get<ApiResponse<Prediction[]>>(`${this.api}/users/predictions`, { params });
  }

  // Admin - Users
  getUsers(page: number = 1, limit: number = 20, search?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<any>>(`${this.api}/users`, { params });
  }

  downloadUsersExcel(): Observable<Blob> {
    return this.http.get(`${this.api}/users/export-excel`, { responseType: 'blob' });
  }

  toggleUserActive(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/users/${id}/toggle-active`, {});
  }

  setUserRole(id: string, role: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/users/${id}/role`, { role });
  }

  adminResetPassword(id: string, newPassword: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/users/${id}/reset-password`, { newPassword });
  }

  getUserPredictions(id: string): Observable<ApiResponse<Prediction[]>> {
    return this.http.get<ApiResponse<Prediction[]>>(`${this.api}/users/${id}/predictions`);
  }

  // Admin - Reports
  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.api}/reports/dashboard`);
  }

  downloadRankingExcel(): Observable<Blob> {
    return this.http.get(`${this.api}/reports/ranking/excel`, { responseType: 'blob' });
  }

  downloadMatchPredictionsExcel(matchId: string): Observable<Blob> {
    return this.http.get(`${this.api}/reports/match/${matchId}/excel`, { responseType: 'blob' });
  }

  downloadPollaSummaryPdf(): Observable<Blob> {
    return this.http.get(`${this.api}/reports/summary/pdf`, { responseType: 'blob' });
  }

  downloadUserPredictionsPdf(userId: string): Observable<Blob> {
    return this.http.get(`${this.api}/reports/user/${userId}/pdf`, { responseType: 'blob' });
  }
}
