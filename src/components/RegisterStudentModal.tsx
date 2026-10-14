import React, { useState } from 'react';
import { DietPreference, Student } from '../types';

interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterStudent: (newStudent: Student) => void | Promise<void>;
}

const ACADEMIC_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'PG / Masters'
];

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Comm.',
  'Mechanical Engg.',
  'Civil Engineering',
  'Electrical & Electronics',
  'Artificial Intelligence & DS'
];

export const RegisterStudentModal: React.FC<RegisterStudentModalProps> = ({
  isOpen,
  onClose,
  onRegisterStudent
}) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [academicYear, setAcademicYear] = useState('1st Year');
  const [department, setDepartment] = useState('Computer Science');
  const [hostelRoom, setHostelRoom] = useState('BH-1 / 101');
  const [preference, setPreference] = useState<DietPreference>('Veg');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Full name is required (at least 2 letters).';
    }

    if (!id.trim() || id.trim().length < 3) {
      errs.id = 'Valid Roll / Registration Number is required (e.g. 23CS1055).';
    }

    if (!academicYear) {
      errs.academicYear = 'Academic Year is required.';
    }

    if (!department) {
      errs.department = 'Department is required.';
    }

    if (!hostelRoom.trim()) {
      errs.hostelRoom = 'Hostel & Room number is required (e.g. BH-2 / 304).';
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (!digitsOnly) {
      errs.phone = 'Contact mobile number is required.';
    } else if (digitsOnly.length !== 10) {
      errs.phone = `Contact number must be exactly 10 digits (${digitsOnly.length}/10 entered).`;
    } else if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Student institutional email is required.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePhoneChange = (val: string) => {
    // Only allow digits and limit to strictly 10 digits
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (errors.phone) {
      if (digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly)) {
        setErrors((prev) => ({ ...prev, phone: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanDigits = phone.replace(/\D/g, '').slice(-10);
      const formattedPhone = `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;

      const newStudent: Student = {
        id: id.trim().toUpperCase(),
        name: name.trim(),
        academicYear: academicYear.trim(),
        department: department.trim(),
        hostelRoom: hostelRoom.trim(),
        preference,
        status: 'Active Plan',
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name.trim()
        )}&background=002045&color=fff&size=200`,
        phone: formattedPhone,
        email: email.trim().toLowerCase(),
        issuedSessionsToday: {}
      };

      await onRegisterStudent(newStudent);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to register student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c4c6cf] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#002045] text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px]">person_add</span>
            <div>
              <h3 className="text-[17px] font-bold">Register Student Resident</h3>
              <p className="text-[11px] text-white/80">All fields are mandatory for mess backend synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5 overflow-y-auto">
          {/* Full Name */}
          <div>
            <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
              Student Full Name <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aditi Rao"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              className={`w-full h-11 px-3.5 border rounded-lg text-[14px] text-[#0d1c2e] outline-none transition-all ${
                errors.name ? 'border-red-500 bg-red-50/50' : 'border-[#74777f] focus:border-[#002045]'
              }`}
            />
            {errors.name && <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.name}</p>}
          </div>

          {/* Roll Number & Academic Year Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
                Roll / Student ID <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 23CS1055"
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  if (errors.id) setErrors((prev) => ({ ...prev, id: '' }));
                }}
                className={`w-full h-11 px-3.5 border rounded-lg text-[14px] font-mono text-[#0d1c2e] uppercase outline-none transition-all ${
                  errors.id ? 'border-red-500 bg-red-50/50' : 'border-[#74777f] focus:border-[#002045]'
                }`}
              />
              {errors.id && <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.id}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
                Academic Year <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                required
                value={academicYear}
                onChange={(e) => {
                  setAcademicYear(e.target.value);
                  if (errors.academicYear) setErrors((prev) => ({ ...prev, academicYear: '' }));
                }}
                className={`w-full h-11 px-3 border rounded-lg text-[13px] text-[#0d1c2e] bg-white outline-none transition-all ${
                  errors.academicYear ? 'border-red-500 bg-red-50/50' : 'border-[#74777f] focus:border-[#002045]'
                }`}
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              {errors.academicYear && (
                <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.academicYear}</p>
              )}
            </div>
          </div>

          {/* Department & Hostel Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
                Department <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                required
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  if (errors.department) setErrors((prev) => ({ ...prev, department: '' }));
                }}
                className={`w-full h-11 px-3 border rounded-lg text-[13px] text-[#0d1c2e] bg-white outline-none transition-all ${
                  errors.department ? 'border-red-500 bg-red-50/50' : 'border-[#74777f] focus:border-[#002045]'
                }`}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.department}</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
                Hostel Block &amp; Room <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BH-2 / 304"
                value={hostelRoom}
                onChange={(e) => {
                  setHostelRoom(e.target.value);
                  if (errors.hostelRoom) setErrors((prev) => ({ ...prev, hostelRoom: '' }));
                }}
                className={`w-full h-11 px-3 border rounded-lg text-[13px] text-[#0d1c2e] outline-none transition-all ${
                  errors.hostelRoom ? 'border-red-500 bg-red-50/50' : 'border-[#74777f] focus:border-[#002045]'
                }`}
              />
              {errors.hostelRoom && (
                <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.hostelRoom}</p>
              )}
            </div>
          </div>

          {/* Contact Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[12px] font-bold text-[#43474e] uppercase">
                  Contact Phone <span className="text-red-500 font-bold">*</span>
                </label>
                <span className={`text-[11px] font-mono font-bold ${
                  phone.length === 10 && /^[6-9]\d{9}$/.test(phone) ? 'text-emerald-600' : 'text-[#74777f]'
                }`}>
                  {phone.length}/10 digits
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[13px] font-bold text-[#74777f] font-mono select-none pointer-events-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => {
                    const digits = phone.replace(/\D/g, '');
                    if (digits.length > 0 && digits.length !== 10) {
                      setErrors((prev) => ({
                        ...prev,
                        phone: `Contact number must be exactly 10 digits (${digits.length}/10 entered).`
                      }));
                    } else if (digits.length === 10 && !/^[6-9]\d{9}$/.test(digits)) {
                      setErrors((prev) => ({
                        ...prev,
                        phone: 'Mobile number must start with 6, 7, 8, or 9.'
                      }));
                    }
                  }}
                  className={`w-full h-11 pl-12 pr-9 border rounded-lg text-[14px] font-mono text-[#0d1c2e] outline-none transition-all ${
                    errors.phone
                      ? 'border-red-500 bg-red-50/50'
                      : phone.length === 10 && /^[6-9]\d{9}$/.test(phone)
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-[#74777f] focus:border-[#002045]'
                  }`}
                />
                {phone.length === 10 && /^[6-9]\d{9}$/.test(phone) && (
                  <span className="material-symbols-outlined absolute right-2.5 text-emerald-600 text-[18px] pointer-events-none">
                    check_circle
                  </span>
                )}
              </div>
              {errors.phone ? (
                <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.phone}</p>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1">10-digit mobile number</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
                Student Email <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="student@institution.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={`w-full h-11 px-3.5 border rounded-lg text-[14px] text-[#0d1c2e] outline-none transition-all ${
                  errors.email ? 'border-red-500 bg-red-50/50' : 'border-[#74777f] focus:border-[#002045]'
                }`}
              />
              {errors.email && <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.email}</p>}
            </div>
          </div>

          {/* Dietary Preference */}
          <div>
            <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1.5">
              Dietary Preference <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPreference('Veg')}
                className={`h-11 rounded-lg border flex items-center justify-center gap-2 font-bold text-[13px] transition-all cursor-pointer ${
                  preference === 'Veg'
                    ? 'bg-[#9ff5c1] text-[#005231] border-[#0a6c44] shadow-xs ring-2 ring-[#0a6c44]/30'
                    : 'bg-white text-[#43474e] border-[#c4c6cf] hover:bg-[#eff4ff]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#0a6c44]" />
                Vegetarian
              </button>

              <button
                type="button"
                onClick={() => setPreference('Non-Veg')}
                className={`h-11 rounded-lg border flex items-center justify-center gap-2 font-bold text-[13px] transition-all cursor-pointer ${
                  preference === 'Non-Veg'
                    ? 'bg-[#ffdbcd] text-[#93000a] border-[#f47d45] shadow-xs ring-2 ring-[#f47d45]/30'
                    : 'bg-white text-[#43474e] border-[#c4c6cf] hover:bg-[#eff4ff]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#f47d45]" />
                Non-Vegetarian
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-[#c4c6cf]/50 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 px-5 border border-[#74777f] rounded-lg text-[13px] font-bold text-[#43474e] hover:bg-[#eff4ff] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-6 bg-[#002045] hover:bg-[#1a365d] active:scale-95 text-white rounded-lg text-[13px] font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Saving to Backend...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Add Student Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default RegisterStudentModal;
