import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NewBleepComponent } from './new-bleep.component';

describe('NewBleepComponent', () => {
  let component: NewBleepComponent;
  let fixture: ComponentFixture<NewBleepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewBleepComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NewBleepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
