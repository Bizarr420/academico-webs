export type Role = 'admin' | 'docente' | 'padre';


export interface User {
id: number;
name: string;
role: Role;
}


export interface AuthResponse {
access_token: string;
token_type: 'bearer' | string;
user: User;
}