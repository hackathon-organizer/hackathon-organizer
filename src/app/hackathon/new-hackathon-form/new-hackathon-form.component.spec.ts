import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewHackathonFormComponent } from './new-hackathon-form.component';

describe('NewHackathonFormComponent', () => {
  let component: NewHackathonFormComponent;
  let fixture: ComponentFixture<NewHackathonFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewHackathonFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewHackathonFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
