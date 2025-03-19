import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { FiMinus, FiPlus } from 'react-icons/fi';

const LEVEL_CATEGORIES = {
  JUNIOR: 'JUNIOR',
  SENIOR: 'SENIOR'
};

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' }
];

const StudentModal = ({ isOpen, onClose, school, initialData, onSave }) => {
  const [studentData, setStudentData] = useState({
    name: '',
    level: LEVEL_CATEGORIES.JUNIOR,
    gender: '',
    uniformStatus: {},
    uniformQuantities: {},
    ...initialData
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setStudentData(initialData);
    } else {
      // Initialize uniform status and quantities for new students
      const initialUniformStatus = {};
      const initialUniformQuantities = {};
      if (school?.uniformRequirements?.[LEVEL_CATEGORIES.JUNIOR]) {
        Object.entries(school.uniformRequirements[LEVEL_CATEGORIES.JUNIOR]).forEach(([category, items]) => {
          items.forEach((item, index) => {
            initialUniformStatus[`${category}-${index}`] = 'pending';
            initialUniformQuantities[`${category}-${index}`] = item?.quantityPerStudent || 1;
          });
        });
      }
      setStudentData(prev => ({
        ...prev,
        uniformStatus: initialUniformStatus,
        uniformQuantities: initialUniformQuantities
      }));
    }
  }, [initialData, school]);

  const handleLevelChange = (level) => {
    // Reset uniform status and quantities when level changes
    const newUniformStatus = {};
    const newUniformQuantities = {};
    if (school?.uniformRequirements?.[level]) {
      Object.entries(school.uniformRequirements[level]).forEach(([category, items]) => {
        items.forEach((item, index) => {
          newUniformStatus[`${category}-${index}`] = 'pending';
          newUniformQuantities[`${category}-${index}`] = item?.quantityPerStudent || 1;
        });
      });
    }

    setStudentData(prev => ({
      ...prev,
      level,
      uniformStatus: newUniformStatus,
      uniformQuantities: newUniformQuantities
    }));
  };

  const handleUniformStatusChange = (category, index, status) => {
    setStudentData(prev => ({
      ...prev,
      uniformStatus: {
        ...prev.uniformStatus,
        [`${category}-${index}`]: status
      }
    }));
  };

  // Add handler for quantity changes
  const handleQuantityChange = (category, index, change) => {
    const key = `${category}-${index}`;
    const currentQuantity = studentData.uniformQuantities[key] || 1;
    const newQuantity = Math.max(1, currentQuantity + change); // Ensure quantity is at least 1
    
    setStudentData(prev => ({
      ...prev,
      uniformQuantities: {
        ...prev.uniformQuantities,
        [key]: newQuantity
      }
    }));
  };

  const handleSave = async () => {
    if (!studentData.name || !studentData.gender || !studentData.level) {
      return;
    }

    try {
      setLoading(true);
      await onSave(studentData);
      onClose();
    } catch (error) {
      console.error('Error saving student:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Student' : 'Add New Student'}
      size="xl"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Student Name"
            value={studentData.name}
            onChange={(e) => setStudentData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <Select
            label="Gender"
            value={studentData.gender}
            onChange={(value) => setStudentData(prev => ({ ...prev, gender: value }))}
            options={GENDER_OPTIONS}
            required
          />
          <Select
            label="Level"
            value={studentData.level}
            onChange={handleLevelChange}
            options={Object.entries(LEVEL_CATEGORIES).map(([key, value]) => ({
              value,
              label: value
            }))}
            required
          />
        </div>

        {/* Uniform Requirements */}
        {school?.uniformRequirements && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Uniform Requirements</h3>
            {Object.entries(school.uniformRequirements[studentData.level] || {}).map(([category, items]) => (
              items && items.length > 0 && (
                <div key={category} className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </h4>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Required
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item, index) => {
                          const key = `${category}-${index}`;
                          const quantity = studentData.uniformQuantities[key] || item?.quantityPerStudent || 1;
                          
                          return (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{item?.item || 'Unnamed Item'}</div>
                                <div className="text-xs text-gray-500">
                                  {item?.variants?.length > 0 && `Variants: ${item.variants?.join(', ')}`}
                                  {item?.colors?.length > 0 && ` • Colors: ${item.colors?.join(', ')}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  item?.required
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item?.required ? 'Required' : 'Optional'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleQuantityChange(category, index, -1)}
                                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                                    disabled={quantity <= 1}
                                  >
                                    <FiMinus className="h-4 w-4" />
                                  </button>
                                  <span className="w-8 text-center font-medium">{quantity}</span>
                                  <button 
                                    type="button"
                                    onClick={() => handleQuantityChange(category, index, 1)}
                                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                                  >
                                    <FiPlus className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Select
                                  value={studentData.uniformStatus[key] || 'pending'}
                                  onChange={(value) => handleUniformStatusChange(category, index, value)}
                                  options={[
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'ordered', label: 'Ordered' },
                                    { value: 'completed', label: 'Completed' }
                                  ]}
                                  className="w-32"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={loading || !studentData.name || !studentData.gender || !studentData.level}
        >
          {loading ? 'Saving...' : (initialData ? 'Update Student' : 'Add Student')}
        </Button>
      </div>
    </Modal>
  );
};

export default StudentModal; 