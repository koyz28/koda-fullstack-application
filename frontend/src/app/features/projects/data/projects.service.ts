import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.config';
import { Paginated } from '../../../shared/models/pagination';
import { DEFAULT_SORT, Project, ProjectPayload, ProjectQuery } from './project.models';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/projects`;

  list(query: ProjectQuery): Observable<Paginated<Project>> {
    return this.http.get<Paginated<Project>>(this.baseUrl, { params: toHttpParams(query) });
  }

  get(id: number): Observable<Project> {
    return this.http.get<{ data: Project }>(`${this.baseUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: ProjectPayload): Observable<Project> {
    return this.http.post<{ data: Project }>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  update(id: number, payload: ProjectPayload): Observable<Project> {
    return this.http
      .put<{ data: Project }>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

/**
 * Converts a query into API parameters, omitting empty/default values to keep URLs clean.
 */
export function toHttpParams(query: ProjectQuery): HttpParams {
  let params = new HttpParams().set('page', query.page).set('per_page', query.perPage);

  const search = query.search.trim();
  if (search) params = params.set('search', search);
  if (query.status) params = params.set('status', query.status);
  if (query.priority) params = params.set('priority', query.priority);
  if (query.sort !== DEFAULT_SORT) params = params.set('sort', query.sort);

  return params;
}
