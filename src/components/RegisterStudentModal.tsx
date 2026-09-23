import React, { useState } from 'react';
import { DietPreference, Student } from '../types';

interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterStudent: (newStudent: Student) => void;
}

export const RegisterStudentModal: React.FC<RegisterStudentModalProps> = ({
  isOpen,
  onClose,
  onRegisterStudent
}) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [hostelRoom, setHostelRoom] = useState('BH-1 / 101');
  const [preference, setPreference] = useState<DietPreference>('Veg');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id.trim()) {
      alert('Please enter student name and roll number.');
      return;
    }

    const newStudent: Student = {
      id: id.trim().toUpperCase(),
      name: name.trim(),
      department: department.trim(),
      hostelRoom: hostelRoom.trim(),
      preference,
      status: 'Active Plan',
      photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name.trim()
      )}&background=002045&color=fff&size=200`,
      phone: phone.trim() || '+91 99999 00000',
      email: `${id.trim().toLowerCase()}@institution.edu`,
      issuedSessionsToday: {}
    };

    onRegisterStudent(newStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c4c6cf] shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#002045] text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">person_add</span>
            <h3 className="text-[17px] font-bold">Register New Student</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aditi Rao"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 border border-[#74777f] rounded-lg text-[14px] text-[#0d1c2e] focus:border-[#002045] outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
              Roll / Registration No. *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 22CS1055 or STU-9901"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full h-11 px-3.5 border border-[#74777f] rounded-lg text-[14px] font-mono text-[#0d1c2e] focus:border-[#002045] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-11 px-3 border border-[#74777f] rounded-lg text-[13px] text-[#0d1c2e] bg-white focus:border-[#002045] outline-none"
              >
                <option>Computer Science</option>
                <option>Electronics &amp; Comm.</option>
                <option>Mechanical Engg.</option>
                <option>Civil Engineering</option>
                <option>Information Technology</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
                Hostel / Room
              </label>
              <input
                type="text"
                placeholder="e.g. BH-2 / 304"
                value={hostelRoom}
                onChange={(e) => setHostelRoom(e.target.value)}
                className="w-full h-11 px-3 border border-[#74777f] rounded-lg text-[13px] text-[#0d1c2e] focus:border-[#002045] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1.5">
              Dietary Preference
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPreference('Veg')}
                className={`h-11 rounded-lg border flex items-center justify-center gap-2 font-bold text-[13px] transition-all ${
                  preference === 'Veg'
                    ? 'bg-[#9ff5c1] text-[#005231] border-[#0a6c44] shadow-xs'
                    : 'bg-white text-[#43474e] border-[#c4c6cf]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#0a6c44]" />
                Vegetarian
              </button>

              <button
                type="button"
                onClick={() => setPreference('Non-Veg')}
                className={`h-11 rounded-lg border flex items-center justify-center gap-2 font-bold text-[13px] transition-all ${
                  preference === 'Non-Veg'
                    ? 'bg-[#ffdbcd] text-[#93000a] border-[#f47d45] shadow-xs'
                    : 'bg-white text-[#43474e] border-[#c4c6cf]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#f47d45]" />
                Non-Vegetarian
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1">
              Contact Phone (Optional)
            </label>
            <input
              type="tel"
              placeholder="+91 98765 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 px-3.5 border border-[#74777f] rounded-lg text-[14px] text-[#0d1c2e] focus:border-[#002045] outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-[#c4c6cf]/50 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 border border-[#74777f] rounded-lg text-[13px] font-bold text-[#43474e] hover:bg-[#eff4ff]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 px-6 bg-[#002045] hover:bg-[#1a365d] text-white rounded-lg text-[13px] font-bold shadow-xs transition-colors"
            >
              Add Student Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
