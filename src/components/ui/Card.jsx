import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  title, 
  className = '', 
  headerAction,
  noPadding = false 
}) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {headerAction && (
            <div className="ml-4">{headerAction}</div>
          )}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
  headerAction: PropTypes.node,
  noPadding: PropTypes.bool,
};

export default Card; 