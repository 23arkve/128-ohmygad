// We're putting all of the constants here so we don't have to put them in individual files
export const UPB_PROGRAMS: Record<string, { value: string; label: string }[]> = {
  CS: [
    { value: "BS Biology", label: "BS Biology" },
    { value: "BS Computer Science", label: "BS Computer Science" },
    { value: "BS Mathematics", label: "BS Mathematics" },
    { value: "BS Physics", label: "BS Physics" },
    { value: "MS Conservation and Restoration Ecology", label: "MS Conservation and Restoration Ecology" },
    { value: "MS Mathematics", label: "MS Mathematics" },
    { value: "Doctor of Philosophy in Mathematics", label: "Doctor of Philosophy in Mathematics" },
  ],
  CAC: [
    { value: "BA Communication", label: "BA Communication" },
    { value: "BA Fine Arts", label: "BA Fine Arts" },
    { value: "BA Language and Literature", label: "BA Language and Literature" },
    { value: "Certificate in Fine Arts", label: "Certificate in Fine Arts" },
    { value: "MA Language and Literature", label: "MA Language and Literature" },
  ],
  CSS: [
    { value: "BA Social Sciences (History)", label: "BA Social Sciences (History)" },
    { value: "BA Social Sciences (Economics)", label: "BA Social Sciences (Economics)" },
    { value: "BA Social Sciences (Anthropology)", label: "BA Social Sciences (Anthropology)" },
    { value: "BS Management Economics", label: "BS Management Economics" },
    { value: "MA History (Ethnohistory and Local History)", label: "MA History (Ethnohistory and Local History)" },
    { value: "MA Social and Development Studies", label: "MA Social and Development Studies" },
    { value: "Master of Management", label: "Master of Management" },
    { value: "Doctor of Philosophy in Indigenous Studies", label: "Doctor of Philosophy in Indigenous Studies" },
  ],
};

export const PRONOUNS = [
  { value: "he/him", label: "he/him" },
  { value: "she/her", label: "she/her" },
  { value: "they/them", label: "they/them" },
  { value: "he/they", label: "he/they" },
  { value: "she/they", label: "she/they" },
  { value: "any/all", label: "any/all" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

export const SEX_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Intersex", label: "Intersex" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

export const GENDER_OPTIONS = [
  { value: "Man", label: "Man" },
  { value: "Woman", label: "Woman" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Genderqueer", label: "Genderqueer" },
  { value: "Transgender man", label: "Transgender man" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

export const COLLEGE_OPTIONS = [
  { value: "CS", label: "College of Science (CS)" },
  { value: "CAC", label: "College of Arts and Communication (CAC)" },
  { value: "CSS", label: "College of Social Sciences (CSS)" },
];

export const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "faculty", label: "Faculty" },
  { value: "student", label: "Student" },
];

export const YEAR_OPTIONS = [
  { value: "1st Year", label: "1st Year" },
  { value: "2nd Year", label: "2nd Year" },
  { value: "3rd Year", label: "3rd Year" },
  { value: "4th Year", label: "4th Year" },
  { value: "5th Year", label: "5th Year" },
  { value: "Extendee", label: "Extendee" },
];

export const EVENT_CATEGORY_OPTIONS = [
  { value: "GSO", label: "GSO" },
  { value: "ASHO", label: "ASHO" },
  { value: "Forum", label: "Forum" },
  { value: "Research", label: "Research" },
  { value: "Training", label: "Training" },
  { value: "Workshop", label: "Workshop" },
];

export const EVENT_STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "today", label: "Today" },
];

export const SURVEY_STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming"},
  { value: "open",   label: "Open"   },
  { value: "closed", label: "Closed" },
];

export const QUESTION_TYPE_OPTIONS = [
  { value: "text",            label: "Text (open-ended)" },
  { value: "multiple_choice", label: "Multiple Choice"   },
  { value: "rating",          label: "Likert Scale (1–5)"},
  { value: "yes_no",          label: "Yes / No"          },
];

export const CATEGORY_GRADIENT: Record<string, string> = {
  Orientation: "linear-gradient(135deg, #F4C97A 0%, #FAF8FF 100%)",
  Forum:       "linear-gradient(135deg, #F4A7B9 0%, #FAF8FF 100%)",
  Research:    "linear-gradient(135deg, #B8B5E8 0%, #FAF8FF 100%)",
  Training:    "linear-gradient(135deg, #6DC5A0 0%, #FAF8FF 100%)",
  Workshop:    "linear-gradient(135deg, #2D2A4A 0%, #FAF8FF 100%)",
};
export const DEFAULT_GRADIENT = "linear-gradient(135deg, #B8B5E8 0%, #2D2A4A 100%)";

type BadgeVariant = "pink-light" | "periwinkle" | "dark" | "success" | "warning" | "error";

export const EVENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  upcoming: "pink-light",
  past: "periwinkle",
  today: "success", 
};

export const CATEGORY_VARIANT: Record<string, BadgeVariant> = {
  GSO: "pink-light",
  ASHO: "pink-light",
  Forum: "periwinkle",
  Research: "error",
  Training: "success",
  Workshop: "warning",
};

export const REG_STATUS_VARIANT: Record<string, BadgeVariant> = {
  registered: "periwinkle",
  attended:   "success",
  cancelled:  "error",
  pending:    "warning",
  invited:    "pink-light",
};

export const SURVEY_STATUS_VARIANT: Record<string, BadgeVariant> = {
  upcoming: "pink-light",
  open: "success",
  closed: "periwinkle",
};

