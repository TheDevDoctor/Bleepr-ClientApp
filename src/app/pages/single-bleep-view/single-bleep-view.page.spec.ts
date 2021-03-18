import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SingleBleepViewPage } from './single-bleep-view.page';

describe('SingleBleepViewPage', () => {
  let component: SingleBleepViewPage;
  let fixture: ComponentFixture<SingleBleepViewPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SingleBleepViewPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SingleBleepViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
