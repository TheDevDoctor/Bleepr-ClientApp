import { Component, OnInit, ElementRef } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { DatabaseService } from 'src/app/services/database.service';
import { UserService } from 'src/app/services/user.service';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { environment } from 'src/environments/environment';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';

@Component({
  selector: 'app-suggested-connections',
  templateUrl: './suggested-connections.component.html',
  styleUrls: ['./suggested-connections.component.scss'],
})
export class SuggestedConnectionsComponent implements OnInit {

  connections: any;

  constructor(
    private userService: UserService
  ) { }

  ngOnInit() {
    this.userService.returnSuggestedConnections().subscribe(connections => {
      this.connections = connections;
    });
  }
}
