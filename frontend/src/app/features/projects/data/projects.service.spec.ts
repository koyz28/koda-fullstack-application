import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DEFAULT_PROJECT_QUERY, ProjectPayload } from './project.models';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('omits empty filters and the default sort from list requests', () => {
    service.list({ ...DEFAULT_PROJECT_QUERY, search: '   ' }).subscribe();

    const req = http.expectOne((r) => r.url === '/api/projects');
    expect(req.request.params.keys().sort()).toEqual(['page', 'per_page']);
    req.flush({ data: [], meta: {} });
  });

  it('sends search, filters and sort when provided', () => {
    service
      .list({
        ...DEFAULT_PROJECT_QUERY,
        search: ' acme ',
        status: 'on_hold',
        priority: 'high',
        sort: '-due_date',
        page: 2,
      })
      .subscribe();

    const req = http.expectOne((r) => r.url === '/api/projects');
    expect(req.request.params.get('search')).toBe('acme');
    expect(req.request.params.get('status')).toBe('on_hold');
    expect(req.request.params.get('priority')).toBe('high');
    expect(req.request.params.get('sort')).toBe('-due_date');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ data: [], meta: {} });
  });

  it('unwraps the data envelope for single-resource calls', () => {
    const payload: ProjectPayload = {
      client_name: 'Acme',
      project_name: 'Site',
      description: null,
      status: 'planning',
      priority: 'low',
      start_date: '2026-10-01',
      due_date: null,
    };
    let result: unknown;

    service.update(7, payload).subscribe((project) => (result = project));

    const req = http.expectOne('/api/projects/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: { id: 7, ...payload } });

    expect(result).toEqual({ id: 7, ...payload });
  });

  it('issues DELETE requests', () => {
    service.delete(3).subscribe();
    expect(http.expectOne('/api/projects/3').request.method).toBe('DELETE');
  });
});
