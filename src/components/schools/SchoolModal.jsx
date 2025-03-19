import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useSchoolStore } from '../../stores/schoolStore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const LEVEL_CATEGORIES = {
  JUNIOR: 'JUNIOR',
  SENIOR: 'SENIOR'
};

const UNIFORM_CATEGORIES = {
  BOYS: 'BOYS',
  GIRLS: 'GIRLS'
};

const defaultSchoolData = {
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    principalName: '',
    establishedYear: '',
    notes: '',
    uniformRequirements: {
    JUNIOR: {
      BOYS: [],
      GIRLS: []
    },
    SENIOR: {
      BOYS: [],
      GIRLS: []
    }
    },
    students: []
};

const SchoolModal = ({ isOpen, onClose, initialData }) => {
  const { addSchool, updateSchool } = useSchoolStore();
  const [activeTab, setActiveTab] = useState(0);
  const [schoolData, setSchoolData] = useState(defaultSchoolData);
  const [loading, setLoading] = useState(false);
  const [availableUniforms, setAvailableUniforms] = useState([]);

  // Update the fetchUniforms function to fetch all uniforms
  useEffect(() => {
    const fetchUniforms = async () => {
      try {
        const uniformsRef = collection(db, 'uniforms');
        const snapshot = await getDocs(uniformsRef);
        const uniforms = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
          id: doc.id,
            ...data,
            // Normalize the data
            level: data.level?.toUpperCase() || 'JUNIOR',
            gender: data.gender?.toUpperCase() || 'UNISEX',
            name: data.name || 'Unnamed Uniform'
          };
        });
        console.log('Fetched uniforms:', uniforms);
        setAvailableUniforms(uniforms);
      } catch (error) {
        console.error('Error fetching uniforms:', error);
        setAvailableUniforms([]);
      }
    };

    fetchUniforms();
  }, []);

  useEffect(() => {
    if (initialData) {
      // Ensure uniformRequirements has the correct structure
      const requirements = {
        JUNIOR: {
          BOYS: [],
          GIRLS: []
        },
        SENIOR: {
          BOYS: [],
          GIRLS: []
        }
      };

      // Merge existing requirements with the default structure
      if (initialData.uniformRequirements) {
        Object.entries(initialData.uniformRequirements).forEach(([level, categories]) => {
          if (requirements[level]) {
            Object.entries(categories).forEach(([category, items]) => {
              if (requirements[level][category]) {
                requirements[level][category] = Array.isArray(items) ? items : [];
              }
            });
          }
        });
      }

      setSchoolData({
        ...defaultSchoolData,
        ...initialData,
        uniformRequirements: requirements
      });
    } else {
      setSchoolData(defaultSchoolData);
    }
  }, [initialData]);

  const handleSave = async () => {
    try {
      setLoading(true);
      if (initialData?.id) {
        await updateSchool(initialData.id.toString(), schoolData);
      } else {
        await addSchool(schoolData);
      }
    onClose();
    } catch (error) {
      console.error('Error saving school:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const handleAddUniformItem = (level, category) => {
    setSchoolData(prev => ({
      ...prev,
      uniformRequirements: {
        ...prev.uniformRequirements,
        [level]: {
          ...prev.uniformRequirements[level],
        [category]: [
            ...(prev.uniformRequirements[level]?.[category] || []),
            {
              uniformId: '',
              item: '',
              quantityPerStudent: 1,
              required: true
            }
          ]
        }
      }
    }));
  };

  const handleRemoveUniformItem = (level, category, index) => {
    setSchoolData(prev => {
      const newRequirements = {
        ...prev.uniformRequirements,
        [level]: {
          ...prev.uniformRequirements[level],
          [category]: prev.uniformRequirements[level][category].filter((_, i) => i !== index)
        }
      };
      return { ...prev, uniformRequirements: newRequirements };
    });
  };

  const handleUpdateUniformItem = (level, category, index, field, value) => {
    setSchoolData(prev => {
      const newRequirements = { ...prev.uniformRequirements };
      if (field === 'uniformId') {
        const uniform = availableUniforms.find(u => u.id === value);
        newRequirements[level][category][index] = {
          ...newRequirements[level][category][index],
          uniformId: value,
          item: uniform?.name || ''
        };
      } else {
        newRequirements[level][category][index] = {
          ...newRequirements[level][category][index],
          [field]: value
        };
      }
      return { ...prev, uniformRequirements: newRequirements };
    });
  };

  const getFilteredUniforms = (level, category) => {
    return availableUniforms.filter(uniform => {
      const matchesLevel = uniform.level?.toUpperCase() === level?.toUpperCase();
      const isUnisex = uniform.gender?.toUpperCase() === 'UNISEX';
      const matchesCategory = uniform.gender?.toUpperCase() === category?.toUpperCase();
      return matchesLevel && (isUnisex || matchesCategory);
    });
  };

  const renderUniformSection = (level, category) => {
    const filteredUniforms = getFilteredUniforms(level, category);
    const items = schoolData.uniformRequirements?.[level]?.[category] || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{category}</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddUniformItem(level, category)}
          >
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">No items added yet</p>
            <button
              onClick={() => handleAddUniformItem(level, category)}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
            >
              Add your first item
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <Select
                    value={item.uniformId}
                    onChange={(value) => handleUpdateUniformItem(level, category, index, 'uniformId', value)}
                    options={filteredUniforms.map(uniform => ({
                      value: uniform.id,
                      label: uniform.name
                    }))}
                    placeholder="Select uniform"
                  />
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantityPerStudent}
                    onChange={(e) => handleUpdateUniformItem(level, category, index, 'quantityPerStudent', parseInt(e.target.value) || 1)}
                    placeholder="Quantity"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.required}
                      onChange={(e) => handleUpdateUniformItem(level, category, index, 'required', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Required</span>
                  </label>
                  <button
                    onClick={() => handleRemoveUniformItem(level, category, index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { name: 'School Details', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Required Items', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit ${initialData.name}` : 'Add New School'}
      size="xl"
    >
      <div className="flex flex-col h-full">
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-4 border-b border-gray-200 mb-6">
            {tabs.map((tab, index) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'px-4 py-2 text-sm font-medium leading-5 text-gray-700',
                    'focus:outline-none focus:ring-0',
                    selected
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )
                }
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span>{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="flex-1 overflow-y-auto">
            <Tab.Panel>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="School Name"
                    value={schoolData.name}
                    onChange={(e) => setSchoolData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <Input
                    label="Principal Name"
                    value={schoolData.principalName}
                    onChange={(e) => setSchoolData(prev => ({ ...prev, principalName: e.target.value }))}
                  />
                  <Input
                    label="Phone"
                    value={schoolData.phone}
                    onChange={(e) => setSchoolData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={schoolData.email}
                    onChange={(e) => setSchoolData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    label="Website"
                    value={schoolData.website}
                    onChange={(e) => setSchoolData(prev => ({ ...prev, website: e.target.value }))}
                  />
                  <Input
                    label="Established Year"
                    type="number"
                    value={schoolData.establishedYear}
                    onChange={(e) => setSchoolData(prev => ({ ...prev, establishedYear: e.target.value }))}
                  />
                </div>
                <div>
                  <Input
                    label="Address"
                    value={schoolData.address}
                    onChange={(e) => setSchoolData(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={schoolData.notes}
                    onChange={(e) => setSchoolData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel>
              <RequirementsTab
                schoolData={schoolData}
                setSchoolData={setSchoolData}
                availableUniforms={availableUniforms}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !schoolData.name || !schoolData.address}>
            {loading ? 'Saving...' : (initialData ? 'Update School' : 'Add School')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const RequirementsTab = ({ schoolData, setSchoolData, availableUniforms }) => {
  const handleAddUniformItem = (level, category) => {
    setSchoolData(prev => ({
      ...prev,
      uniformRequirements: {
        ...prev.uniformRequirements,
        [level]: {
          ...prev.uniformRequirements[level],
          [category]: [
            ...(prev.uniformRequirements[level]?.[category] || []),
            {
              uniformId: '',
              item: '',
              quantityPerStudent: 1,
              required: true
            }
          ]
        }
      }
    }));
  };

  const handleRemoveUniformItem = (level, category, index) => {
    setSchoolData(prev => {
      const newRequirements = {
        ...prev.uniformRequirements,
        [level]: {
          ...prev.uniformRequirements[level],
          [category]: prev.uniformRequirements[level][category].filter((_, i) => i !== index)
        }
      };
      return { ...prev, uniformRequirements: newRequirements };
    });
  };

  const handleUpdateUniformItem = (level, category, index, field, value) => {
    setSchoolData(prev => {
      const newRequirements = { ...prev.uniformRequirements };
      if (field === 'uniformId') {
        const uniform = availableUniforms.find(u => u.id === value);
        newRequirements[level][category][index] = {
          ...newRequirements[level][category][index],
          uniformId: value,
          item: uniform?.name || ''
        };
      } else {
        newRequirements[level][category][index] = {
          ...newRequirements[level][category][index],
          [field]: value
        };
      }
      return { ...prev, uniformRequirements: newRequirements };
    });
  };

  const getFilteredUniforms = (level, category) => {
    return availableUniforms.filter(uniform => {
      const matchesLevel = uniform.level?.toUpperCase() === level?.toUpperCase();
      const isUnisex = uniform.gender?.toUpperCase() === 'UNISEX';
      const matchesCategory = uniform.gender?.toUpperCase() === category?.toUpperCase();
      return matchesLevel && (isUnisex || matchesCategory);
    });
  };

  const renderUniformSection = (level, category) => {
    const filteredUniforms = getFilteredUniforms(level, category);
    const items = schoolData.uniformRequirements?.[level]?.[category] || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{category}</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddUniformItem(level, category)}
          >
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">No items added yet</p>
            <button
              onClick={() => handleAddUniformItem(level, category)}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
            >
              Add your first item
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <Select
                    value={item.uniformId}
                    onChange={(value) => handleUpdateUniformItem(level, category, index, 'uniformId', value)}
                    options={filteredUniforms.map(uniform => ({
                      value: uniform.id,
                      label: uniform.name
                    }))}
                    placeholder="Select uniform"
                  />
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantityPerStudent}
                    onChange={(e) => handleUpdateUniformItem(level, category, index, 'quantityPerStudent', parseInt(e.target.value) || 1)}
                    placeholder="Quantity"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.required}
                      onChange={(e) => handleUpdateUniformItem(level, category, index, 'required', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Required</span>
                  </label>
                  <button
                    onClick={() => handleRemoveUniformItem(level, category, index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Junior Level */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-medium text-gray-900">Junior Level</h2>
        </div>
        <div className="p-6 space-y-8">
          {renderUniformSection('JUNIOR', 'BOYS')}
          {renderUniformSection('JUNIOR', 'GIRLS')}
        </div>
      </div>

      {/* Senior Level */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-medium text-gray-900">Senior Level</h2>
        </div>
        <div className="p-6 space-y-8">
          {renderUniformSection('SENIOR', 'BOYS')}
          {renderUniformSection('SENIOR', 'GIRLS')}
        </div>
      </div>
    </div>
  );
};

export default SchoolModal; 