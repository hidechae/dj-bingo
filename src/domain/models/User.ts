// User domain model

export type UserEntity = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password?: string | null; // Optional for security - only included when needed
};

// Type for authentication purposes that includes password
export type UserEntityWithPassword = UserEntity & {
  password: string | null;
};
