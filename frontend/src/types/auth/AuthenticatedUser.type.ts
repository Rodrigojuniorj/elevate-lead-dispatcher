export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR';
  callCenterId: string | null;
};
