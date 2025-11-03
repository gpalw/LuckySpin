import { Role } from "@prisma/client";

// jwt.types.ts
export type AuthSubject = {
    id: string;              // required
    role: Role;            // Role Enum as string
    username?: string | null; // optional, for compatibility
};
