/**
 * Extracts initials from a name or email address.
 * Examples:
 * - "John Doe" -> "JD"
 * - "john.doe@example.com" -> "J"
 * - "Jane" -> "JA"
 */
export function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Fallback to email if name is missing
  return email[0].toUpperCase();
}
