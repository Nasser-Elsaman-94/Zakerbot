import React from 'react';

interface ConfirmationModalProps {
  title: string;
  options: {
    label: string;
    action: () => void;
    isDestructive?: boolean;
  }[];
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, options, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex flex-col gap-3">
          {options.map((opt, index) => (
            <button
              key={index}
              onClick={opt.action}
              className={`w-full px-4 py-2 font-semibold rounded-md transition-colors ${
                opt.isDestructive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 font-semibold bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
