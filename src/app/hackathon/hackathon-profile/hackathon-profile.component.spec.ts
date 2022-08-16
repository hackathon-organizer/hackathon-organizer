import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HackathonProfileComponent } from './hackathon-profile.component';

describe('HackathonProfileComponent', () => {
  let component: HackathonProfileComponent;
  let fixture: ComponentFixture<HackathonProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HackathonProfileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HackathonProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
