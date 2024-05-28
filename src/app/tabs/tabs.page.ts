import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Camera, CameraResultType } from '@capacitor/camera';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  constructor(private auth: AuthService, private router: Router, private alert: AlertService,
    private firestore: AngularFirestore, private firestorage: AngularFireStorage) {}

  cerrarSesion()
  {
    this.auth.logOut().then(() => {
      this.router.navigateByUrl('/login');
    });
  }

  async botonPresionado()
  {
    let textarea = document.getElementById('console');

    const image = await Camera.getPhoto({
      quality: 100,
      promptLabelHeader: 'Seleccione una opción',
      promptLabelPhoto: 'Elegir desde la galería',
      promptLabelPicture: 'Tomar una foto',
      resultType: CameraResultType.DataUrl
    });

    console.log(image);
    
    textarea!.textContent += image.base64String! + '\n';
    textarea!.textContent += image.dataUrl! + '\n'; 
    textarea!.textContent += image.webPath! + '\n'; 
    textarea!.textContent += image.path! + '\n'; 
    textarea!.textContent += image.format! + '\n'; 
    
    await this.subirFotoPerfil('linda', image);
  }

  async subirFotoPerfil(tipo : string, file : any)
  {
    if(file)
    {
      if(file.format == 'jpg' || file.format == 'jpeg' || file.format == 'png' || file.format == 'jfif')
      {
        let fecha = new Date();
        const path = 'Relevamiento/' + this.auth.nombre + '_' + this.auth.id + '/' + fecha.getTime() + '.' + file.format; //Si tuviera que subir varias fotos debería agregar un elemento aleatorio además de la fecha.
        const uploadTask = await this.firestorage.upload(path, file.dataUrl); //Probé con los distintos parámetros de file y cambiando CameraResultType, en ninguno logré subir la foto de forma correcta
        const url = await uploadTask.ref.getDownloadURL();

        const documento = this.firestore.doc("fotos-edificio/" + this.firestore.createId());
        documento.set(
        {
          imagen : url,
          tipo: tipo,
          usuario: this.auth.nombre,
          id: this.auth.id,
          fecha: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), fecha.getHours(), fecha.getMinutes()),
          votos: 0
        });

        this.validarDatoGuardado(documento.ref.id);
      }
      else
      {
        this.alert.failureAlert("ERROR", "Formato de archivo incompatible");
      }
    }
    else
    {
      this.alert.failureAlert("ERROR", "Ningún archivo fue seleccionado");
    }
  }

  validarDatoGuardado(id : string)
  {
    this.firestore.firestore.collection('fotos-edificio').get().then((next : any) =>
    {
      let result : Array<any> = next;
      let exito = false;

      result.forEach(obj =>
      {
        if(id == obj.id)
        {
          exito = true;
          this.alert.sweetAlert("¡Listo!", "Tu foto ya fue publicada", 'success');
        }
      });

      if(exito == false)
      {
        this.alert.failureAlert("ERROR", "Tu foto no pudo publicarse, intente de nuevo más tarde.");
      }
    }).catch(error => { this.alert.failureAlert("ERROR", error);});
  }
}
