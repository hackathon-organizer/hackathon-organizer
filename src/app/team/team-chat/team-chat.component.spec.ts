import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamChatComponent } from './team-chat.component';

describe('TeamChatComponent', () => {
  let component: TeamChatComponent;
  let fixture: ComponentFixture<TeamChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamChatComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
