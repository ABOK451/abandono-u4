import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluacionAlgortimoComponent } from './evaluacion-algortimo.component';

describe('EvaluacionAlgortimoComponent', () => {
  let component: EvaluacionAlgortimoComponent;
  let fixture: ComponentFixture<EvaluacionAlgortimoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaluacionAlgortimoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluacionAlgortimoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
