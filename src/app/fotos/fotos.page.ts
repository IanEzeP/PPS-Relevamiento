import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../services/database.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-fotos',
  templateUrl: './fotos.page.html',
  styleUrls: ['./fotos.page.scss'],
})
export class FotosPage implements OnInit, OnDestroy {

  public loaded: boolean = true;
  public fotos: Array<any> = [];

  private obsDatabase: Subscription = Subscription.EMPTY;

  constructor(private auth: AuthService, private data: DatabaseService) { }

  ngOnInit() 
  {
    console.log("Entro en fotos")
    this.obsDatabase = this.data.getCollectionObservable('fotos-edificio').subscribe((next: any) =>
    {
      let result: Array<any> = next;
      this.fotos = [];

      result.forEach((obj: any) => {
        console.log(obj);
        this.fotos.push(obj);
      });
    });
    console.log("finalizo carga");
  }

  ngOnDestroy(): void 
  {
    this.obsDatabase.unsubscribe();
  }

  //Función votar
}
