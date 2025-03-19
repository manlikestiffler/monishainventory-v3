import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchoolStore } from '../stores/schoolStore';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StudentModal from '../components/schools/StudentModal';
import SchoolTabUI from '../components/schools/SchoolTabUI';
import { 
  FiArrowLeft, 
  FiPlus, 
  FiTrash2, 
  FiEdit2,
  FiUsers,
  FiHome,
  FiPhone,
  FiMinus,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiShoppingBag
} from 'react-icons/fi';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Uniform Card Component with updated UI
const UniformCard = ({ uniform, uniformDetails, onRemove, index, level, gender }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{uniformDetails?.name || 'Unknown Uniform'}</h3>
            <p className="mt-1 text-sm text-gray-500 font-light">{uniformDetails?.description || 'No description available'}</p>
          </div>
          <div className="flex items-center space-x-2">
            {uniform.required ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <FiCheckCircle className="mr-1 h-3 w-3" />
                Required
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <FiInfo className="mr-1 h-3 w-3" />
                Optional
              </span>
            )}
            {onRemove && (
              <button 
                onClick={() => onRemove(level, gender, index)}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                title="Remove uniform"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm bg-red-50 rounded-lg p-3">
          <span className="text-gray-700 font-medium">Quantity per student:</span>
          <span className="font-bold text-red-700 px-3 py-1 bg-white rounded-lg border border-red-100 shadow-sm">
            {uniform.quantityPerStudent || uniform.quantity || 1}
          </span>
        </div>
      </div>
    </div>
  );
};

// Uniform Category Component
const UniformCategory = ({ title, uniforms = [], availableUniforms = [], onAddUniform, onRemoveUniform, level, gender }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          {gender === 'BOYS' ? (
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-2 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
          {title}
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onAddUniform(level, gender)}
          className="flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50"
        >
          <FiPlus className="h-4 w-4" />
          Add Uniform
        </Button>
      </div>
      {uniforms.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">No uniforms added for {title}</p>
            <button 
              onClick={() => onAddUniform(level, gender)}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
            >
              Add your first uniform
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uniforms.map((uniform, index) => (
            <UniformCard
              key={index}
              uniform={uniform}
              uniformDetails={availableUniforms.find(u => u.id === uniform.uniformId)}
              onRemove={onRemoveUniform}
              index={index}
              level={level}
              gender={gender}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Uniform Level Component
const UniformLevel = ({ level, requirements = {}, availableUniforms = [], onAddUniform, onRemoveUniform }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">{level} Level</h2>
      </div>
      <div className="p-6 space-y-8">
        <UniformCategory
          title="Boys Uniforms"
          uniforms={requirements[level]?.BOYS}
          availableUniforms={availableUniforms}
          onAddUniform={onAddUniform}
          onRemoveUniform={onRemoveUniform}
          level={level}
          gender="BOYS"
        />
        <UniformCategory
          title="Girls Uniforms"
          uniforms={requirements[level]?.GIRLS}
          availableUniforms={availableUniforms}
          onAddUniform={onAddUniform}
          onRemoveUniform={onRemoveUniform}
          level={level}
          gender="GIRLS"
        />
      </div>
    </div>
  );
};

// Uniform Sets Component
const UniformSets = ({ uniformRequirements = {}, availableUniforms = [], onAddUniform, onRemoveUniform }) => {
  return (
    <div className="space-y-6">
      <UniformLevel
        level="JUNIOR"
        requirements={uniformRequirements}
        availableUniforms={availableUniforms}
        onAddUniform={onAddUniform}
        onRemoveUniform={onRemoveUniform}
      />
      <UniformLevel
        level="SENIOR"
        requirements={uniformRequirements}
        availableUniforms={availableUniforms}
        onAddUniform={onAddUniform}
        onRemoveUniform={onRemoveUniform}
      />
    </div>
  );
};

// Student List Component
const StudentsList = ({ students = [], onEdit, onDelete }) => {
  // Helper function to get uniform details
  const getUniformSummary = (student) => {
    if (!student.uniformQuantities) return 'No custom quantities';
    
    const quantityKeys = Object.keys(student.uniformQuantities);
    if (quantityKeys.length === 0) return 'No custom quantities';
    
    const customItems = quantityKeys.length;
    const totalQuantity = Object.values(student.uniformQuantities).reduce((sum, qty) => sum + qty, 0);
    
    return `${customItems} items, total: ${totalQuantity}`;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <FiUsers className="mr-2 text-indigo-600" />
          Students
        </h2>
        <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
          {students.length} {students.length === 1 ? 'student' : 'students'}
        </span>
      </div>
      
      {students.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No students added yet</p>
          <p className="text-sm text-gray-400">Click the "Add Student" button to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uniform Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantities
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                      {student.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded-full ${
                      student.gender === 'MALE' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                    }`}>
                      {student.gender === 'MALE' ? 'Male' : 'Female'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{getUniformSummary(student)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {Object.keys(student.uniformQuantities || {}).length > 0 ? (
                        <span className="text-green-600 font-medium">Custom</span>
                      ) : (
                        <span className="text-gray-500">Default</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => onEdit(student)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                      >
                        <FiEdit2 className="w-4 h-4 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => onDelete(student.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <FiTrash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Main component
const NewSchoolDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSchoolById, updateSchool, deleteSchool, getAvailableUniforms } = useSchoolStore();
  
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [availableUniforms, setAvailableUniforms] = useState([]);
  const [showAddUniformModal, setShowAddUniformModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [editMode, setEditMode] = useState({
    active: false,
    field: null,
    value: '',
  });
  
  // State for modal
  const [selectedUniform, setSelectedUniform] = useState(null);
  const [uniformQuantity, setUniformQuantity] = useState(1);
  const [uniformRequired, setUniformRequired] = useState(true);
  
  // Function to fetch school details
  useEffect(() => {
    const fetchSchoolDetails = async () => {
      try {
        setLoading(true);
        const schoolData = await getSchoolById(id);
        if (!schoolData) {
          console.error('School not found');
          navigate('/schools');
          return;
        }
        setSchool(schoolData);
        
        // Fetch available uniforms
        const uniforms = await getAvailableUniforms();
        console.log("Available uniforms:", uniforms); // Debug log
        setAvailableUniforms(uniforms || []);
      } catch (error) {
        console.error('Error fetching school details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchoolDetails();
  }, [id, getSchoolById, getAvailableUniforms, navigate]);
  
  // Function to edit school field
  const handleEditField = (field) => {
    setEditMode({
      active: true,
      field,
      value: school[field] || '',
    });
  };
  
  // Function to save edited field
  const handleSaveField = async () => {
    try {
      let updatedSchool;
      
      if (editMode.field === 'all') {
        updatedSchool = {
          ...school,
          name: editMode.value.name,
          address: editMode.value.address,
          contact: editMode.value.contact
        };
      } else {
        updatedSchool = {
          ...school,
          [editMode.field]: editMode.value,
        };
      }
      
      await updateSchool(updatedSchool);
      setSchool(updatedSchool);
      setEditMode({
        active: false,
        field: null,
        value: '',
      });
    } catch (error) {
      console.error('Error saving field:', error);
    }
  };
  
  // Function to cancel edit
  const handleCancelEdit = () => {
    setEditMode({
      active: false,
      field: null,
      value: '',
    });
  };
  
  // Function to add uniform
  const handleAddUniform = () => {
    // If no uniforms are loaded, fetch them again
    if (!availableUniforms || availableUniforms.length === 0) {
      // Using the function from the context of useSchoolStore
      const fetchUniforms = async () => {
        try {
          const uniforms = await getAvailableUniforms();
          setAvailableUniforms(uniforms || []);
          console.log("Refreshed uniforms:", uniforms);
        } catch (error) {
          console.error("Error fetching uniforms:", error);
        }
      };
      fetchUniforms();
    }
    
    setSelectedUniform(null);
    setUniformQuantity(1);
    setUniformRequired(true);
    setShowAddUniformModal(true);
  };
  
  // Function to select uniform
  const handleSelectUniform = (uniform) => {
    setSelectedUniform(uniform);
  };
  
  // Function to increment quantity
  const handleIncrementQuantity = () => {
    setUniformQuantity(prev => prev + 1);
  };
  
  // Function to decrement quantity
  const handleDecrementQuantity = () => {
    setUniformQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };
  
  // Function to toggle required status
  const handleToggleRequired = () => {
    setUniformRequired(prev => !prev);
  };
  
  // Function to save selected uniform
  const handleSaveUniform = async () => {
    if (!selectedUniform) return;
    
    try {
      const uniformRequirements = school.uniformRequirements || {};
      const level = selectedUniform.level || 'ALL';
      const gender = selectedUniform.gender || 'ALL';
      
      // Initialize the nested structure if it doesn't exist
      if (!uniformRequirements[level]) {
        uniformRequirements[level] = {};
      }
      
      if (!uniformRequirements[level][gender]) {
        uniformRequirements[level][gender] = [];
      }
      
      // Add the uniform with quantity and required flag
      uniformRequirements[level][gender].push({
        id: selectedUniform.id,
        quantity: uniformQuantity,
        required: uniformRequired,
      });
      
      const updatedSchool = {
        ...school,
        uniformRequirements,
      };
      
      await updateSchool(updatedSchool);
      setSchool(updatedSchool);
      setShowAddUniformModal(false);
    } catch (error) {
      console.error('Error adding uniform:', error);
    }
  };
  
  // Function to get uniform details by ID
  const getUniformDetailsById = (id) => {
    return availableUniforms.find(uniform => uniform.id === id);
  };
  
  // Function to remove a uniform
  const handleRemoveUniform = async (level, gender, index) => {
    if (window.confirm('Are you sure you want to remove this uniform requirement?')) {
      try {
        const uniformRequirements = { ...school.uniformRequirements };
        
        // Remove the uniform at the specified index
        uniformRequirements[level][gender].splice(index, 1);
        
        // Clean up empty arrays and objects
        if (uniformRequirements[level][gender].length === 0) {
          delete uniformRequirements[level][gender];
        }
        
        if (Object.keys(uniformRequirements[level]).length === 0) {
          delete uniformRequirements[level];
        }
        
        const updatedSchool = {
          ...school,
          uniformRequirements,
        };
        
        await updateSchool(updatedSchool);
        setSchool(updatedSchool);
      } catch (error) {
        console.error('Error removing uniform:', error);
      }
    }
  };
  
  // Function to get uniform requirements as a flat array
  const getUniformRequirementsArray = () => {
    if (!school?.uniformRequirements) return [];
    
    const result = [];
    
    Object.entries(school.uniformRequirements).forEach(([level, genderMap]) => {
      Object.entries(genderMap).forEach(([gender, uniforms]) => {
        uniforms.forEach((uniform, index) => {
          const uniformDetails = getUniformDetailsById(uniform.id);
          if (uniformDetails) {
            result.push({
              ...uniformDetails,
              ...uniform,
              level,
              gender,
              index,
            });
          }
        });
      });
    });
    
    return result;
  };
  
  // Function to add student
  const handleAddStudent = async (studentData) => {
    try {
      // Generate a unique ID (normally your database would do this)
      const studentId = `student_${Date.now()}`;
      
      const newStudent = {
        id: studentId,
        ...studentData,
      };
      
      const updatedStudents = [...(school.students || []), newStudent];
      const updatedSchool = { ...school, students: updatedStudents };
      
      await updateSchool(updatedSchool);
      setSchool(updatedSchool);
      setShowAddStudentModal(false);
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };
  
  // Function to edit student
  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setShowAddStudentModal(true);
  };
  
  // Function to update student
  const handleUpdateStudent = async (updatedStudentData) => {
    try {
      const updatedStudents = school.students.map(student => 
        student.id === updatedStudentData.id ? updatedStudentData : student
      );
      
      const updatedSchool = { ...school, students: updatedStudents };
      await updateSchool(updatedSchool);
      setSchool(updatedSchool);
      setShowAddStudentModal(false);
      setStudentToEdit(null);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };
  
  // Function to delete student
  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const updatedStudents = school.students.filter(student => student.id !== studentId);
        const updatedSchool = { ...school, students: updatedStudents };
        
        await updateSchool(updatedSchool);
        setSchool(updatedSchool);
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };
  
  // Function to delete the school
  const handleDeleteSchool = async () => {
    if (window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      try {
        await deleteSchool(id);
        navigate('/schools');
      } catch (error) {
        console.error('Error deleting school:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
          <p className="text-red-600 font-medium">Loading school details...</p>
        </div>
      </div>
    );
  }
  
  // Get flat arrays of uniform requirements
  const uniformRequirements = getUniformRequirementsArray();
  const students = school?.students || [];
  
  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Button
          variant="text"
          onClick={() => navigate('/schools')}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <FiArrowLeft className="mr-2 h-5 w-5" />
          Back to Schools
        </Button>
        <Button
          variant="outline"
          onClick={handleDeleteSchool}
          className="bg-white text-red-600 border-red-600 hover:bg-red-50"
        >
          <FiTrash2 className="mr-2 h-5 w-5" />
          Delete School
        </Button>
      </div>

      {/* School Information Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{school.name}</h1>
              <button
                onClick={() => setEditMode({ active: true, field: 'all', value: { name: school.name || '', address: school.address || '', contact: school.contact || '' } })}
                className="ml-2 text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="Edit school details"
              >
                <FiEdit2 className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                <FiHome className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-gray-900 mt-1">{school.address || 'No address'}</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                <FiPhone className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p className="text-gray-900 mt-1">{school.contact || 'No contact information'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {editMode.active && (
            <div className="bg-gray-50 p-5 rounded-lg w-full md:w-1/3 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit School Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input
                    type="text"
                    value={editMode.field === 'all' ? editMode.value.name : editMode.value}
                    onChange={(e) => editMode.field === 'all' 
                      ? setEditMode({ ...editMode, value: { ...editMode.value, name: e.target.value } })
                      : setEditMode({ ...editMode, value: e.target.value })
                    }
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                {editMode.field === 'all' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={editMode.value.address}
                        onChange={(e) => setEditMode({ ...editMode, value: { ...editMode.value, address: e.target.value } })}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                      <input
                        type="text"
                        value={editMode.value.contact}
                        onChange={(e) => setEditMode({ ...editMode, value: { ...editMode.value, contact: e.target.value } })}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-gray-200">
                <Button
                  variant="text"
                  onClick={handleCancelEdit}
                  className="text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveField}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content with SchoolTabUI */}
      <SchoolTabUI 
        school={school}
        uniformRequirements={uniformRequirements}
        students={students}
        availableUniforms={availableUniforms}
        onAddUniform={handleAddUniform}
        onEditUniform={() => {}} // Not implemented yet
        onDeleteUniform={handleRemoveUniform}
        onAddStudent={() => setShowAddStudentModal(true)}
        onEditStudent={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
      />

      {/* Add/Edit Uniform Modal */}
      <Modal
        isOpen={showAddUniformModal}
        onClose={() => setShowAddUniformModal(false)}
        title="Add Uniform Requirement"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Uniform</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
              {!availableUniforms || availableUniforms.length === 0 ? (
                <div className="col-span-2 p-5 text-center bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiShoppingBag className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">No uniforms found in inventory</p>
                  <p className="text-sm text-gray-500 mb-3">Please add uniforms to the inventory first before assigning them to this school.</p>
                  {/* Here you could add a link to the inventory page */}
                </div>
              ) : (
                availableUniforms.map((uniform) => (
                  <div
                    key={uniform.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedUniform?.id === uniform.id
                        ? 'border-red-500 bg-red-50 shadow-sm'
                        : 'border-gray-200 hover:border-red-300 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onClick={() => handleSelectUniform(uniform)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{uniform.name}</h3>
                      {selectedUniform?.id === uniform.id && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">Selected</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{uniform.description || 'No description'}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {uniform.level || 'All Levels'}
                      </span>
                      <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                        {uniform.gender || 'All Genders'}
                      </span>
                      {uniform.category && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          {uniform.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {selectedUniform && (
            <>
              <div className="border-t border-gray-200 pt-4 mt-3">
                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{selectedUniform.name}</h3>
                  {selectedUniform.description && (
                    <p className="text-sm text-gray-600">{selectedUniform.description}</p>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Quantity Per Student</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleDecrementQuantity}
                      disabled={uniformQuantity <= 1}
                      className={`rounded-l-md p-3 border border-r-0 ${
                        uniformQuantity <= 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <FiMinus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={uniformQuantity}
                      onChange={(e) => setUniformQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="block w-20 text-center border-gray-300 focus:ring-red-500 focus:border-red-500 p-2 border-y text-lg font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleIncrementQuantity}
                      className="rounded-r-md p-3 border border-l-0 bg-white text-gray-600 hover:bg-gray-50"
                    >
                      <FiPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uniformRequired}
                      onChange={handleToggleRequired}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">Required uniform</span>
                  </label>
                </div>
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="text"
              onClick={() => setShowAddUniformModal(false)}
              className="text-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveUniform}
              disabled={!selectedUniform}
              className={!selectedUniform ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}
            >
              Add Uniform
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Add/Edit Student Modal */}
      <StudentModal
        isOpen={showAddStudentModal}
        onClose={() => {
          setShowAddStudentModal(false);
          setStudentToEdit(null);
        }}
        onSave={studentToEdit ? handleUpdateStudent : handleAddStudent}
        student={studentToEdit}
        schoolUniformRequirements={uniformRequirements}
        availableUniforms={availableUniforms}
      />
    </div>
  );
};

export default NewSchoolDetails; 