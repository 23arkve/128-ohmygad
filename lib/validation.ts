/*
ok i put all the validation into one file just so that its easierto keep track of and just in case
we want ot use it in another new file

Used by:
components/admin/user-form.tsx       (admin create/edit user)
components/onboarding-form.tsx       (user onboarding)
components/sign-up-form.tsx          (user sign-up)
app/admin/profile/page.tsx           (admin profile save)
app/faculty/profile/page.tsx         (faculty profile save)
app/student/profile/page.tsx         (student profile save)
app/api/admin/create-user/route.ts   (server-side create user)
*/

// ── regex patterns ──────────────────────────────────────────────────────────
const NAME_REGEX = /^[\p{L}\s.'\-_]+$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── individual validators ───────────────────────────────────────────────────
// Each returns an error message string if invalid, or null if valid.

export function validateFullName(name: string): string | null {
  if (!name || !name.trim()) return "Full name is required.";
  if (!NAME_REGEX.test(name)) return "Full name can only contain letters, spaces, and basic punctuation.";
  return null;
}

export function validateDisplayName(name: string): string | null {
  if (!name) return null; // optional field
  if (!NAME_REGEX.test(name)) return "Display name can only contain letters, spaces, and basic punctuation.";
  return null;
}

export function validateContactNum(num: string): string | null {
  if (!num) return null; // optional field
  if (!/^\d+$/.test(num)) return "Contact number can only contain digits.";
  if (num.length != 11) return "Contact number must be 11 digits.";
  return null;
}

export function validateStudentNum(num: string | number): string | null {
  if (!num) return null; // optional field
  const str = String(num);
  if (!/^\d+$/.test(str)) return "Student number can only contain digits.";
  if (str.length !== 9) return "Student number must be exactly 9 digits.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (password.length > 128) return "Password cannot exceed 128 characters.";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) return "Email is required.";
  if (!EMAIL_REGEX.test(email)) return "Please provide a valid email address.";
  return null;
}

export function validateGsoSessions(value: string | number): string | null {
  if (value === "") return null;
  const str = String(value);
  if (!/^\d+$/.test(str)) return "GSO Sessions Attended must be a whole number.";
  const num = Number(str);
  if (num < 0 || num > 5) return "GSO Sessions Attended must be between 0 and 5.";
  return null;
}

export function validateAshoSessions(value: string | number): string | null {
  if (value === "") return null;
  const str = String(value);
  if (!/^\d+$/.test(str)) return "ASHO Sessions Attended must be a whole number.";
  const num = Number(str);
  if (num < 0 || num > 5) return "ASHO Sessions Attended must be between 0 and 5.";
  return null;
}

export function validateAddress(address: string): string | null {
  if (address && address.length > 100) return "Address cannot exceed 100 characters.";
  return null;
}

export function validateOffice(office: string): string | null {
  if (office && office.length > 64) return "Office cannot exceed 64 characters.";
  return null;
}

export function validateDepartment(department: string): string | null {
  if (department && department.length > 64) return "Department cannot exceed 64 characters.";
  return null;
}