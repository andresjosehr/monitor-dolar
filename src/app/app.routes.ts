import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { HistoricoComponent } from './pages/historico/historico.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: InicioComponent },
      { path: 'historico', component: HistoricoComponent }
    ]
  }
];
