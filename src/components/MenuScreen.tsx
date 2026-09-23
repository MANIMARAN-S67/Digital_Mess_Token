import React, { useState, useEffect } from 'react';
import { DailyMenu, MealType } from '../types';

interface MenuScreenProps {
  initialMenu: DailyMenu;
  onSaveMenu: (updatedMenu: DailyMenu) => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ initialMenu, onSaveMenu }) => {
  const [selectedMeal, setSelectedMeal] = useState<MealType>('Breakfast');
  const [menuData, setMenuData] = useState<DailyMenu>(initialMenu);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Sync if initialMenu changes from parent
  useEffect(() => {
    setMenuData(initialMenu);
  }, [initialMenu]);

  const meals: MealType[] = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

  const currentVeg = menuData[selectedMeal].veg;
  const currentNonVeg = menuData[selectedMeal].nonVeg;

  const handleUpdateVeg = (field: 'mainItem' | 'side1' | 'beverage', value: string) => {
    setMenuData((prev) => ({
      ...prev,
      [selectedMeal]: {
        ...prev[selectedMeal],
        veg: {
          ...prev[selectedMeal].veg,
          [field]: value
        }
      }
    }));
  };

  const handleUpdateNonVeg = (field: 'mainItem' | 'side1' | 'beverage', value: string) => {
    setMenuData((prev) => ({
      ...prev,
      [selectedMeal]: {
        ...prev[selectedMeal],
        nonVeg: {
          ...prev[selectedMeal].nonVeg,
          [field]: value
        }
      }
    }));
  };

  const handleAddVegItem = () => {
    const item = window.prompt('Enter extra vegetarian item name (e.g. Curd / Salad / Sweet):');
    if (item && item.trim()) {
      setMenuData((prev) => ({
        ...prev,
        [selectedMeal]: {
          ...prev[selectedMeal],
          veg: {
            ...prev[selectedMeal].veg,
            extras: [...(prev[selectedMeal].veg.extras || []), item.trim()]
          }
        }
      }));
    }
  };

  const handleRemoveVegExtra = (index: number) => {
    setMenuData((prev) => ({
      ...prev,
      [selectedMeal]: {
        ...prev[selectedMeal],
        veg: {
          ...prev[selectedMeal].veg,
          extras: (prev[selectedMeal].veg.extras || []).filter((_: string, i: number) => i !== index)
        }
      }
    }));
  };

  const handleAddNonVegItem = () => {
    const item = window.prompt('Enter extra non-vegetarian item name (e.g. Fish Fry / Chicken Soup):');
    if (item && item.trim()) {
      setMenuData((prev) => ({
        ...prev,
        [selectedMeal]: {
          ...prev[selectedMeal],
          nonVeg: {
            ...prev[selectedMeal].nonVeg,
            extras: [...(prev[selectedMeal].nonVeg.extras || []), item.trim()]
          }
        }
      }));
    }
  };

  const handleRemoveNonVegExtra = (index: number) => {
    setMenuData((prev) => ({
      ...prev,
      [selectedMeal]: {
        ...prev[selectedMeal],
        nonVeg: {
          ...prev[selectedMeal].nonVeg,
          extras: (prev[selectedMeal].nonVeg.extras || []).filter((_: string, i: number) => i !== index)
        }
      }
    }));
  };

  const handleSave = () => {
    onSaveMenu(menuData);
    setShowToast(`Menu for ${selectedMeal} published successfully!`);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleDiscard = () => {
    setMenuData(initialMenu);
    setShowToast('Changes discarded.');
    setTimeout(() => setShowToast(null), 2500);
  };

  const getMealIcon = (meal: MealType) => {
    switch (meal) {
      case 'Breakfast':
        return 'free_breakfast';
      case 'Lunch':
        return 'lunch_dining';
      case 'Snacks':
        return 'bakery_dining';
      case 'Dinner':
        return 'dinner_dining';
    }
  };

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-4 pb-28 md:pb-12 flex flex-col gap-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#002045] text-white px-4 py-3 rounded-lg shadow-lg border border-[#adc7f7] flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[#9ff5c1]">check_circle</span>
          <span className="text-[14px] font-medium">{showToast}</span>
        </div>
      )}

      {/* Header and Date Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-[24px] font-semibold text-[#0d1c2e] tracking-tight">
            Menu Management
          </h2>
          <p className="text-[15px] text-[#43474e] mt-0.5">
            Update today's menu offerings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold bg-[#dce9ff] px-3.5 py-1.5 rounded-lg text-[#002045] border border-[#c4c6cf]/40 flex items-center gap-1.5 shadow-2xs">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            Wed, Oct 25
          </span>
        </div>
      </div>

      {/* Meal Selection Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {meals.map((meal) => {
          const isActive = selectedMeal === meal;
          return (
            <button
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              className={`shrink-0 h-12 px-6 rounded-full font-bold text-[14px] flex items-center justify-center whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-[#002045] text-white shadow-sm'
                  : 'bg-[#e5eeff] text-[#0d1c2e] border border-[#c4c6cf]/60 hover:bg-[#dce9ff]'
              }`}
            >
              {meal}
            </button>
          );
        })}
      </div>

      {/* Menu Entry Form Card */}
      <div className="bg-white rounded-xl border border-[#c4c6cf] p-4 sm:p-6 shadow-sm">
        <h3 className="text-[20px] font-semibold text-[#0d1c2e] mb-6 flex items-center gap-2.5 pb-3 border-b border-[#c4c6cf]/40">
          <span className="material-symbols-outlined text-[#455f88] text-[26px]">
            {getMealIcon(selectedMeal)}
          </span>
          <span>{selectedMeal} Menu</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vegetarian Category */}
          <div className="flex flex-col gap-4 bg-[#f8f9ff] p-4 rounded-xl border border-[#9ff5c1]/60">
            <div className="flex items-center justify-between pb-2 border-b border-[#c4c6cf]/30">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#0a6c44]" />
                <h4 className="font-bold text-[13px] uppercase tracking-wider text-[#0a6c44]">
                  Vegetarian
                </h4>
              </div>
              <span className="text-[11px] text-[#43474e] font-medium">Standard Diet</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#43474e]">Main Item</label>
              <input
                className="w-full h-11 px-3.5 border border-[#c4c6cf] rounded bg-white focus:border-[#002045] focus:ring-1 focus:ring-[#002045] outline-none text-[15px] text-[#0d1c2e]"
                type="text"
                value={currentVeg.mainItem}
                onChange={(e) => handleUpdateVeg('mainItem', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#43474e]">Side 1</label>
              <input
                className="w-full h-11 px-3.5 border border-[#c4c6cf] rounded bg-white focus:border-[#002045] focus:ring-1 focus:ring-[#002045] outline-none text-[15px] text-[#0d1c2e]"
                type="text"
                value={currentVeg.side1}
                onChange={(e) => handleUpdateVeg('side1', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#43474e]">Beverage</label>
              <input
                className="w-full h-11 px-3.5 border border-[#c4c6cf] rounded bg-white focus:border-[#002045] focus:ring-1 focus:ring-[#002045] outline-none text-[15px] text-[#0d1c2e]"
                type="text"
                value={currentVeg.beverage}
                onChange={(e) => handleUpdateVeg('beverage', e.target.value)}
              />
            </div>

            {/* Extra Veg Items */}
            {currentVeg.extras?.length > 0 && (
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[11px] font-semibold text-[#74777f] uppercase">
                  Additional Items
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentVeg.extras.map((extra: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#9ff5c1] text-[#0a6c44] text-[12px] font-medium rounded"
                    >
                      {extra}
                      <button
                        onClick={() => handleRemoveVegExtra(idx)}
                        className="text-[#ba1a1a] hover:opacity-80"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAddVegItem}
              className="h-11 mt-1 flex items-center justify-center gap-2 border border-dashed border-[#74777f] text-[#455f88] rounded hover:bg-[#eff4ff] active:scale-98 transition-all font-bold text-[14px]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Veg Item
            </button>
          </div>

          {/* Non-Vegetarian Category */}
          <div className="flex flex-col gap-4 bg-[#f8f9ff] p-4 rounded-xl border border-[#ffdbcd]">
            <div className="flex items-center justify-between pb-2 border-b border-[#c4c6cf]/30">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#ba1a1a]" />
                <h4 className="font-bold text-[13px] uppercase tracking-wider text-[#93000a]">
                  Non-Vegetarian
                </h4>
              </div>
              <span className="text-[11px] text-[#43474e] font-medium">Special Diet</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#43474e]">Main Item</label>
              <input
                className="w-full h-11 px-3.5 border border-[#c4c6cf] rounded bg-white focus:border-[#002045] focus:ring-1 focus:ring-[#002045] outline-none text-[15px] text-[#0d1c2e]"
                type="text"
                value={currentNonVeg.mainItem}
                onChange={(e) => handleUpdateNonVeg('mainItem', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#43474e]">Side 1</label>
              <input
                className="w-full h-11 px-3.5 border border-[#c4c6cf] rounded bg-white focus:border-[#002045] focus:ring-1 focus:ring-[#002045] outline-none text-[15px] text-[#0d1c2e]"
                type="text"
                value={currentNonVeg.side1}
                onChange={(e) => handleUpdateNonVeg('side1', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#43474e]">Beverage</label>
              <input
                className="w-full h-11 px-3.5 border border-[#c4c6cf] rounded bg-white focus:border-[#002045] focus:ring-1 focus:ring-[#002045] outline-none text-[15px] text-[#0d1c2e]"
                type="text"
                value={currentNonVeg.beverage}
                onChange={(e) => handleUpdateNonVeg('beverage', e.target.value)}
              />
            </div>

            {/* Extra Non-Veg Items */}
            {currentNonVeg.extras?.length > 0 && (
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[11px] font-semibold text-[#74777f] uppercase">
                  Additional Items
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentNonVeg.extras.map((extra: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#ffdbcd] text-[#93000a] text-[12px] font-medium rounded"
                    >
                      {extra}
                      <button
                        onClick={() => handleRemoveNonVegExtra(idx)}
                        className="text-[#ba1a1a] hover:opacity-80"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAddNonVegItem}
              className="h-11 mt-1 flex items-center justify-center gap-2 border border-dashed border-[#74777f] text-[#455f88] rounded hover:bg-[#eff4ff] active:scale-98 transition-all font-bold text-[14px]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Non-Veg Item
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-5 border-t border-[#c4c6cf]/60 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={handleDiscard}
            className="h-12 px-6 rounded-lg border border-[#002045] text-[#002045] font-bold text-[14px] flex items-center justify-center hover:bg-[#eff4ff] active:scale-98 transition-all"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            className="h-12 px-6 rounded-lg bg-[#002045] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm hover:bg-[#1a365d] active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">publish</span>
            Save and Publish
          </button>
        </div>
      </div>
    </div>
  );
};
