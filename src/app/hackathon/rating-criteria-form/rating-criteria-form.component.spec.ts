import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingCriteriaFormComponent } from './rating-criteria-form.component';

describe('RatingCriteriaFormComponent', () => {
  let component: RatingCriteriaFormComponent;
  let fixture: ComponentFixture<RatingCriteriaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RatingCriteriaFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RatingCriteriaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
