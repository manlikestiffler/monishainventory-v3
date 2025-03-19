import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import Button from './Button';

const Modal = ({
  open = false,
  isOpen = false,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  showClose = true,
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const isModalOpen = Boolean(open || isOpen);

  return (
    <Dialog
      as="div"
      className="relative z-50"
      open={isModalOpen}
      onClose={onClose}
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className={`w-full ${sizes[size]} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}>
            <div className="flex justify-between items-start">
              <Dialog.Title
                as="h3"
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </Dialog.Title>
              {showClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mt-4">
              {children}
            </div>

            {actions && (
              <div className="mt-6 flex justify-end space-x-3">
                {actions}
              </div>
            )}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

Modal.propTypes = {
  open: PropTypes.bool,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  showClose: PropTypes.bool,
};

export default Modal;