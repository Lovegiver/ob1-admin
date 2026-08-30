import { isProjectMemberRole, type ProjectMemberRole } from "@/services/projectMemberService";

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasControlCharacter(value: string): boolean {
    return Array.from(value).some((character) => {
        const codePoint = character.codePointAt(0);
        return codePoint !== undefined && (codePoint < 32 || codePoint === 127);
    });
}

export interface ProjectDraft {
    name: string;
    description: string | null;
}

export interface MemberDraft {
    email: string;
    role: ProjectMemberRole;
}

export function validateProjectDraft(
    nameValue: string,
    descriptionValue: string,
): { value?: ProjectDraft; error?: string } {
    const name = nameValue.trim();
    const description = descriptionValue.trim();

    if (!name) return { error: "Le nom du Project est requis." };
    if (name.length > 100) return { error: "Le nom ne peut pas dépasser 100 caractères." };
    if (description.length > 255) return { error: "La description ne peut pas dépasser 255 caractères." };
    if (hasControlCharacter(name) || hasControlCharacter(description)) {
        return { error: "Les caractères de contrôle ne sont pas autorisés." };
    }

    return { value: { name, description: description || null } };
}

export function validateMemberDraft(
    emailValue: string,
    roleValue: unknown,
): { value?: MemberDraft; error?: string } {
    const email = emailValue.trim().toLowerCase();

    if (!SIMPLE_EMAIL.test(email) || email.length > 254 || hasControlCharacter(email)) {
        return { error: "Saisissez l’adresse e-mail valide d’un compte existant." };
    }
    if (!isProjectMemberRole(roleValue)) {
        return { error: "Le rôle sélectionné n’est pas autorisé." };
    }

    return { value: { email, role: roleValue } };
}
