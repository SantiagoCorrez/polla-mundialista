import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, ApiResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private _currentUser = signal<User | null>(null);
  private _accessToken = signal<string | null>(null);

  currentUser = this._currentUser.asReadonly();
  accessToken = this._accessToken.asReadonly();
  isAuthenticated = computed(() => !!this._currentUser());
  isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
      this._accessToken.set(token);
      this._currentUser.set(JSON.parse(user));
    }
  }

  register(data: { fullName: string; username: string; email: string; cedula: string; password: string }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, data);
  }

  login(identifier: string, password: string): Observable<ApiResponse<{ user: User; accessToken: string }>> {
    return this.http.post<ApiResponse<{ user: User; accessToken: string }>>(
      `${this.apiUrl}/login`,
      { identifier, password },
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this._currentUser.set(res.data.user);
        this._accessToken.set(res.data.accessToken);
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
      })
    );
  }

  refresh(): Observable<ApiResponse<{ accessToken: string }>> {
    return this.http.post<ApiResponse<{ accessToken: string }>>(
      `${this.apiUrl}/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this._accessToken.set(res.data.accessToken);
        localStorage.setItem('accessToken', res.data.accessToken);
      }),
      catchError(() => {
        this.logout();
        return of(null as any);
      })
    );
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe();
    this._currentUser.set(null);
    this._accessToken.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  updateLocalUser(user: Partial<User>) {
    const current = this._currentUser();
    if (current) {
      const updated = { ...current, ...user };
      this._currentUser.set(updated);
      localStorage.setItem('currentUser', JSON.stringify(updated));
    }
  }

  getToken(): string | null {
    return this._accessToken();
  }
}
