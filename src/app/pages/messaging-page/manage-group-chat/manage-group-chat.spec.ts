import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ManageGroupChatModal } from './manage-group-chat.modal';

describe('ManageGroupChatModal', () => {
  let component: ManageGroupChatModal;
  let fixture: ComponentFixture<ManageGroupChatModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageGroupChatModal ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageGroupChatModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
