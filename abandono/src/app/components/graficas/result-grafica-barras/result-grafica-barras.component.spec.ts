import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultGraficaBarrasComponent } from './result-grafica-barras.component';

describe('ResultGraficaBarrasComponent', () => {
  let component: ResultGraficaBarrasComponent;
  let fixture: ComponentFixture<ResultGraficaBarrasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResultGraficaBarrasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultGraficaBarrasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
