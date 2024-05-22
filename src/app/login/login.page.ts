import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../classes/user';
import { DatabaseService } from '../services/database.service';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {

  public cargaFin: boolean = false;

  public arrayFirebase: Array<User> = [];
  public arrayTestUsers: Array<User> = [];
  public formLog : FormGroup;

  private obsDatabase: Subscription = Subscription.EMPTY;

  constructor(private alert: AlertService, private router: Router, private data: DatabaseService,
     private auth: AuthService, public formBuilder: FormBuilder) 
  { 
    console.log("Entro en Login");
    this.formLog = this.formBuilder.group({
      email: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50), this.emailValidator, this.spaceValidator]],
      password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(25), this.spaceValidator]]
    });
  }

  //#region custom validators
  private emailValidator(control : AbstractControl) : null | object
  { 
    const value = <string>control.value;
    const arroba = value.includes('@');

    if(!arroba)
    {
      return { formatoInvalido: true };
    }
    else
    {
      return null;
    }
  }

  private spaceValidator(control : AbstractControl) : null | object
  { 
    const value = <string>control.value.toString();
    const espacios = value.includes(' ');
    
    if(espacios)
    {
      return { contieneEspacios: true };
    }
    else
    {
      return null;
    }
  }
  //#endregion


  ngOnInit() 
  {
    this.cleanInputs();
    
    this.obsDatabase = this.data.getCollectionObservable('usuarios').subscribe((next: any) =>
    {
      let result: Array<any> = next;
      this.arrayFirebase = [];
      this.arrayTestUsers = [];

      result.forEach((obj: any) => {
        this.arrayFirebase.push(new User(obj.id, obj.correo, obj.clave, obj.perfil, obj.sexo, obj.nombre));
      });
      
      this.arrayFirebase.forEach(user => 
      {
        if(user.id == 1 || user.id == 2 || user.id == 3)
        {
          this.arrayTestUsers.push(user);
        }

        this.cargaFin = true;
        console.log("Carga Fin");
      });
    });
  }

  ngOnDestroy(): void 
  {
    this.obsDatabase.unsubscribe();
  }

  async iniciarSesion()
  {
    let tmpUser: User = User.initialize();
    console.log("Entro en iniciar sesion");
    if(this.formLog.valid)
    {
      let formValues = this.formLog.value;
      this.arrayFirebase.forEach(usuario => 
      {
        if(usuario.correo == formValues.email && usuario.clave == formValues.password)
        {
          tmpUser = usuario;
        }
      });
      await this.auth.logIn(tmpUser.correo, tmpUser.clave).then(res =>
      {
        console.log("Usuario valido");
        //if(res!.user.emailVerified == true) { }
        this.auth.email = res!.user.email || '';
        this.auth.perfil = tmpUser.perfil;
        this.alert.successToast("Sesión iniciada correctamente"); //El toast de Ionic no tapa el header ni el footer, vamos a tener que usar ese.
        this.cleanInputs();

        this.router.navigateByUrl('/menu');
      }
      ).catch(() => {
        this.auth.logOut();
        this.alert.sweetAlert('Error', 'No fue posible iniciar sesión, compruebe los datos ingresados', 'error');
        this.formLog.reset({password: ''});
      });
    }
    else
    {
      this.alert.sweetAlert('Error', 'Debe llenar los campos para iniciar sesión', 'error');
    }
  }

  onQuickUser(user: any) 
  {
    this.formLog.controls['email'].setValue(user.target.value.correo);
    this.formLog.controls['password'].setValue(user.target.value.clave);
  }

  cleanInputs()
  {
    this.formLog.reset({email: '', password: ''});
  }
}
