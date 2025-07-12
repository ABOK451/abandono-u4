import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultGrafiaPastelComponent } from './result-grafia-pastel.component';

describe('ResultGrafiaPastelComponent', () => {
  let component: ResultGrafiaPastelComponent;
  let fixture: ComponentFixture<ResultGrafiaPastelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResultGrafiaPastelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultGrafiaPastelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
