import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { FiUsers, FiShoppingBag, FiPlus } from 'react-icons/fi';
import ModernUniformRequirements from './ModernUniformRequirements';
import ModernStudentList from './ModernStudentList';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const SchoolTabUI = ({ 
  school, 
  uniformRequirements, 
  students, 
  availableUniforms, 
  onAddUniform, 
  onEditUniform,
  onDeleteUniform, 
  onAddStudent, 
  onEditStudent, 
  onDeleteStudent 
}) => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <Tab.Group onChange={setSelectedTab} selectedIndex={selectedTab}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 pb-0">
          <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">
            {school?.name} Management
          </h2>
          
          <Tab.List className="flex space-x-2 rounded-xl bg-red-50 p-1 max-w-md">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-red-700',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-red-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow'
                    : 'text-red-500 hover:bg-white/[0.12] hover:text-red-700'
                )
              }
            >
              <div className="flex items-center justify-center">
                <FiShoppingBag className="mr-2" />
                Uniforms
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-red-700',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-red-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow'
                    : 'text-red-500 hover:bg-white/[0.12] hover:text-red-700'
                )
              }
            >
              <div className="flex items-center justify-center">
                <FiUsers className="mr-2" />
                Students
              </div>
            </Tab>
          </Tab.List>
        </div>

        <div className="mt-4 p-6 pt-0">
          <div className="flex justify-end mb-4">
            {selectedTab === 0 && (
              <button
                onClick={onAddUniform}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiPlus className="mr-2" />
                Add Uniform
              </button>
            )}
            {selectedTab === 1 && (
              <button
                onClick={onAddStudent}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiPlus className="mr-2" />
                Add Student
              </button>
            )}
          </div>
          
          <Tab.Panels>
            <Tab.Panel>
              <ModernUniformRequirements
                uniforms={uniformRequirements}
                onEdit={onEditUniform}
                onDelete={onDeleteUniform}
              />
            </Tab.Panel>
            <Tab.Panel>
              <ModernStudentList
                students={students}
                onEdit={onEditStudent}
                onDelete={onDeleteStudent}
              />
            </Tab.Panel>
          </Tab.Panels>
        </div>
      </Tab.Group>
    </div>
  );
};

export default SchoolTabUI; 