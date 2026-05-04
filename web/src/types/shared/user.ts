export enum UserRole {
  VOYAGEUR = "VOYAGEUR",
  OPERATEUR = "OPERATEUR",
  AGENT_SUPPORT = "AGENT_SUPPORT",
  ADMIN = "ADMIN",
}

export interface User {
  readonly id: string;
  readonly email: string;
  readonly phone?: string;
  readonly role: UserRole;
  readonly twoFactorEnabled: boolean;
}
