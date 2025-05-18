import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor(private supabaseService: SupabaseService) {
    // Suscribirse a cambios en la autenticación
    this.supabaseService.getClient().auth.onAuthStateChange((event, session) => {
      this.currentUser.next(session?.user ?? null);
    });
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabaseService.getClient().auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabaseService.getClient().auth.signOut();
    if (error) throw error;
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }
}
