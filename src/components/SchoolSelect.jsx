import { useState, useEffect } from 'react';
import { useSchoolStore } from '../stores/schoolStore';

const SchoolSelect = ({ value, onChange, className, required }) => {
  const { schools, fetchSchools } = useSchoolStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        await fetchSchools();
      } catch (error) {
        console.error('Error loading schools:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSchools();
  }, [fetchSchools]);

  return (
    <select
      value={value}
      onChange={onChange}
      className={className}
      required={required}
      disabled={loading}
    >
      <option value="">Select School</option>
      {schools.map((school) => (
        <option key={school.id} value={school.id}>
          {school.name}
        </option>
      ))}
    </select>
  );
};

export default SchoolSelect; 