import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FormData, DEMAND_TYPES } from '../types';
import { CHINA_LOCATIONS } from '../constants';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

const INITIAL_FORM_STATE: FormData = {
  companyName: '',
  province: '',
  city: '',
  district: '',
  address: '',
  capacity: '0.00',
  demandType: '光伏',
  demandTypeOther: '',
  availableTime: '14:00-18:00',
  industryType: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // Update available cities when province changes
  useEffect(() => {
    if (formData.province && CHINA_LOCATIONS[formData.province]) {
      setAvailableCities(Object.keys(CHINA_LOCATIONS[formData.province]));
      setFormData(prev => ({ ...prev, city: '', district: '' }));
    } else {
      setAvailableCities([]);
      setAvailableDistricts([]);
    }
  }, [formData.province]);

  // Update available districts when city changes
  useEffect(() => {
    if (formData.province && formData.city && CHINA_LOCATIONS[formData.province][formData.city]) {
      setAvailableDistricts(CHINA_LOCATIONS[formData.province][formData.city]);
      setFormData(prev => ({ ...prev, district: '' }));
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.city, formData.province]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pass data to parent component to update state
    onSubmit(formData);
    
    alert(`登记成功！\n企业: ${formData.companyName}\n您的数据已添加到大屏中。`);
    onClose();
    setFormData(INITIAL_FORM_STATE);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">登记我的资源</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <form id="registrationForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">企业名称 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                placeholder=""
              />
            </div>

            {/* Region Selection (Province/City/District) */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">省份 <span className="text-red-500">*</span></label>
                <select
                  name="province"
                  required
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  {Object.keys(CHINA_LOCATIONS).map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">城市 <span className="text-red-500">*</span></label>
                <select
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!formData.province}
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">请选择</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">区/县 <span className="text-red-500">*</span></label>
                <select
                  name="district"
                  required
                  value={formData.district}
                  onChange={handleChange}
                  disabled={!formData.city}
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">请选择</option>
                  {availableDistricts.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Detailed Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">需求容量 (MW) <span className="text-red-500">*</span></label>
              <div className="flex items-center border border-gray-200 bg-gray-50 rounded-md overflow-hidden">
                <input
                  type="number"
                  step="0.01"
                  name="capacity"
                  required
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-transparent focus:outline-none"
                />
                <div className="flex flex-col border-l border-gray-200">
                  <button type="button" className="px-2 hover:bg-gray-200 text-xs py-1" onClick={() => setFormData(p => ({...p, capacity: (parseFloat(p.capacity || '0') + 0.1).toFixed(2)}))}>+</button>
                  <button type="button" className="px-2 hover:bg-gray-200 text-xs py-1 border-t border-gray-200" onClick={() => setFormData(p => ({...p, capacity: Math.max(0, parseFloat(p.capacity || '0') - 0.1).toFixed(2)}))}>-</button>
                </div>
              </div>
            </div>

            {/* Demand Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">需求类型 <span className="text-red-500">*</span></label>
              <select
                name="demandType"
                required
                value={formData.demandType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DEMAND_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Conditional Input for "Other" */}
            {formData.demandType === '其他' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-1">请补充说明具体需求类型 (必填)</label>
                <input
                  type="text"
                  name="demandTypeOther"
                  required
                  value={formData.demandTypeOther}
                  onChange={handleChange}
                  placeholder="请输入具体类型"
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Available Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">可响应时段 (例如: 14:00-18:00)</label>
              <input
                type="text"
                name="availableTime"
                value={formData.availableTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Industry Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">行业类型 (工业园区/商场/写字楼等)</label>
              <input
                type="text"
                name="industryType"
                value={formData.industryType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系邮箱</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button
            type="submit"
            form="registrationForm"
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-md transition-colors shadow-md w-full sm:w-auto"
          >
            提交登记
          </button>
        </div>
      </div>
    </div>
  );
};