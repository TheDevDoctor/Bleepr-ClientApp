import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UsersService } from 'src/app/services/users.service';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';

@Component({
  selector: 'app-connect-request',
  templateUrl: './connect-request.component.html',
  styleUrls: ['./connect-request.component.scss'],
})
export class ConnectRequestComponent implements OnInit {
  public baseUri: string;
  public isAction = false;
  connect: any;
  @Input() id: string;

  // response to emit, can be true (request accepted) or false (request declined).
  @Output() response: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private usersService: UsersService
  ) {
    this.baseUri = environment.blobStorage.storageUri;
  }

  ngOnInit() {
    this.usersService.getUserFragment(this.id).subscribe(response => {
      this.connect = response.body;
    });

    this.baseUri = environment.blobStorage.storageUri;
  }

  acceptRequest() {
    this.isAction = true;
    this.response.emit(true);
  }

  declineRequest() {
    this.response.emit(false);
  }

}
