import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSerachComponent } from './user-serach.component';

describe('UserSerachComponent', () => {
  let component: UserSerachComponent;
  let fixture: ComponentFixture<UserSerachComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserSerachComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSerachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
