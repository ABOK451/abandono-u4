import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultGraficaDispersionComponent } from './result-grafica-dispersion.component';

describe('ResultGraficaDispersionComponent', () => {
  let component: ResultGraficaDispersionComponent;
  let fixture: ComponentFixture<ResultGraficaDispersionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResultGraficaDispersionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultGraficaDispersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
