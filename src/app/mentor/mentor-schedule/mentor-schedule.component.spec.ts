import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MentorScheduleComponent } from './mentor-schedule.component';

describe('MentorScheduleComponent', () => {
  let component: MentorScheduleComponent;
  let fixture: ComponentFixture<MentorScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MentorScheduleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MentorScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
