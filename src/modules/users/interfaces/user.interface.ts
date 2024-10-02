export interface UserInterface {
  id: number;
  username: string;
  email: string;
  roles: {
    id: string;
    name: string;
  }[]; // Array of role objects, each with id and name
  tenant: {
    id: string;
    name: string;
  }; // Tenant object with id and name
}
