import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ProjectFormPage } from './project-form-page';

describe('ProjectFormPage', () => {
  let controller: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFormPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    controller = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => controller.verify());

  async function render() {
    const fixture = TestBed.createComponent(ProjectFormPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function type(el: HTMLElement, selector: string, value: string) {
    const input = el.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  it('shows required-field errors and does not submit an empty form', async () => {
    const { fixture, el } = await render();

    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();

    const errors = Array.from(el.querySelectorAll('.field-error')).map((e) =>
      e.textContent?.trim(),
    );
    expect(errors).toContain('Client name is required.');
    expect(errors).toContain('Project name is required.');
    controller.expectNone('/api/projects');
  });

  it('blocks a due date earlier than the start date', async () => {
    const { fixture, el } = await render();
    type(el, '#client_name', 'Acme');
    type(el, '#project_name', 'Website');
    type(el, '#start_date', '2026-10-10');
    type(el, '#due_date', '2026-10-01');

    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();

    expect(el.textContent).toContain('Due date cannot be earlier than the start date.');
    controller.expectNone('/api/projects');
  });

  it('posts a trimmed payload and maps server validation errors back onto fields', async () => {
    const { fixture, el } = await render();
    type(el, '#client_name', '  Acme  ');
    type(el, '#project_name', 'Website');
    type(el, '#start_date', '2026-10-10');

    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();

    const req = controller.expectOne('/api/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      client_name: 'Acme',
      description: null,
      due_date: null,
    });

    req.flush(
      {
        message: 'The given data was invalid.',
        errors: { project_name: ['That project name is taken.'] },
      },
      { status: 422, statusText: 'Unprocessable Content' },
    );
    await fixture.whenStable();

    expect(el.textContent).toContain('That project name is taken.');
    expect(el.textContent).toContain('Please correct the highlighted fields.');
  });
});
