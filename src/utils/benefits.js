export const BENEFIT_STATUS = { pending: 'Awaiting review', resubmission: 'Updates requested', approved: 'Verified', rejected: 'Application rejected' }
export const benefitKind = (kind) => kind === 'senior' ? 'Senior Citizen' : 'Person with Disability (PWD)'
export function benefitLinkLabel(application) {
  if (!application) return 'Apply for Senior Citizen / PWD verification'
  return {
    pending: 'View Senior Citizen / PWD application status',
    resubmission: 'Update your Senior Citizen / PWD application',
    approved: `Verified as ${benefitKind(application.kind)}`,
    rejected: 'View rejected Senior Citizen / PWD application',
  }[application.status] || 'View Senior Citizen / PWD verification'
}
export function validateBenefitInformation(values, today = new Date(), accountBirthdate = '') {
  if (!['senior', 'pwd'].includes(values.kind)) return 'Choose an applicant type.'
  if (!/^[\p{L}][\p{L}\p{M} .'-]{1,59}$/u.test(values.full_name.trim())) return 'Enter your full name (2–60 characters).'
  const birth = new Date(`${values.date_of_birth}T00:00:00`)
  const parts = values.date_of_birth.split('-').map(Number)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date_of_birth) || !Number.isFinite(birth.getTime()) || birth > today || birth.getFullYear() < 1900 || birth.getFullYear() !== parts[0] || birth.getMonth() + 1 !== parts[1] || birth.getDate() !== parts[2]) return 'Enter a valid date of birth.'
  const age = today.getFullYear() - birth.getFullYear() - (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate()) ? 1 : 0)
  if (accountBirthdate && values.kind === 'senior') {
    if (values.date_of_birth !== accountBirthdate) return 'The Senior Citizen birthdate must match the birthdate on the customer account.'
    const accountBirth = new Date(`${accountBirthdate}T00:00:00`)
    const accountAge = today.getFullYear() - accountBirth.getFullYear() - (today.getMonth() < accountBirth.getMonth() || (today.getMonth() === accountBirth.getMonth() && today.getDate() < accountBirth.getDate()) ? 1 : 0)
    if (accountAge < 60) return 'Senior Citizen applications require an account birthdate showing age 60 or older.'
  }
  if (values.kind === 'senior' && age < 60) return 'Senior Citizen applicants must be at least 60 years old.'
  if (!/^[0-9]{3,20}$/.test(values.id_number)) return 'Enter an ID number with 3–20 digits only.'
  return ''
}
